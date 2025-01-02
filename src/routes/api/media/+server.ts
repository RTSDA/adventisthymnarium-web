import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', keyData, encoder.encode(message));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const GET: RequestHandler = async ({ url, platform }) => {
  if (!platform?.env) throw error(500, 'Platform environment not available');

  const { R2_ACCESS_KEY_ID: accessKey, R2_SECRET_ACCESS_KEY: secretKey, R2_ACCOUNT_ID: accountId } = platform.env;

  if (!accessKey || !secretKey || !accountId) {
    throw error(500, 'Missing required R2 credentials');
  }

  const path = url.searchParams.get('path');
  if (!path) throw error(400, 'Path parameter is required');

  const region = 'auto';
  const date = new Date();
  const dateStamp = date.toISOString().split('T')[0].replace(/-/g, '');
  const amzDate = dateStamp + 'T' + date.toISOString().split('T')[1].replace(/:/g, '').split('.')[0] + 'Z';
  const bucketName = 'hymnarium';
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  // Canonical request
  const method = 'GET';
  const canonicalUri = `/${path}`;
  const canonicalQueryString = '';
  const canonicalHeaders = [
    `host:${accountId}.r2.cloudflarestorage.com`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n';
  const signedHeaders = 'host;x-amz-date';
  const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string hash

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  // String to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    scope,
    await toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
  ].join('\n');

  // Calculate signature
  const encoder = new TextEncoder();
  const kDate = await hmacSha256(encoder.encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 's3');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = await toHex(await hmacSha256(kSigning, stringToSign));

  // Form authorization header
  const credential = `${accessKey}/${dateStamp}/${region}/s3/aws4_request`;
  const authorizationHeader = `${algorithm} Credential=${credential},SignedHeaders=${signedHeaders},Signature=${signature}`;

  const headers = {
    'x-amz-date': amzDate,
    'Authorization': authorizationHeader
  };

  try {
    const response = await fetch(`${endpoint}/${bucketName}/${path}`, { headers });
    if (!response.ok) throw error(response.status, response.statusText);

    const data = await response.arrayBuffer();
    return new Response(data, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (e) {
    console.error('Failed to fetch from R2:', e);
    throw error(500, 'Failed to fetch media');
  }
}; 