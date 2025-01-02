import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac, createHash } from 'crypto';
import { env } from '$lib/server/env';

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const path = url.searchParams.get('path');
    if (!path) {
      throw error(400, 'Missing path parameter');
    }

    const accessKey = env.R2_ACCESS_KEY_ID;
    const secretKey = env.R2_SECRET_ACCESS_KEY;
    const accountId = env.R2_ACCOUNT_ID;
    
    if (!accessKey || !secretKey || !accountId) {
      throw error(500, 'Missing required R2 credentials');
    }
    
    const region = 'auto';
    const bucketName = 'adventist-hymnarium-assets';

    const host = `${accountId}.r2.cloudflarestorage.com`;
    const baseUrl = `https://${host}`;
    const fullUrl = `${baseUrl}/${bucketName}/${path}`;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    // Get range header if present
    const range = request.headers.get('range');

    const headers: Record<string, string> = {
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Content-SHA256': 'UNSIGNED-PAYLOAD'
    };

    if (range) {
      headers['Range'] = range;
    }

    const canonicalRequest = [
      'GET',
      `/${bucketName}/${path}`,
      '',
      `host:${host}`,
      'x-amz-content-sha256:UNSIGNED-PAYLOAD',
      `x-amz-date:${amzDate}`,
      '',
      'host;x-amz-content-sha256;x-amz-date',
      'UNSIGNED-PAYLOAD'
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/${region}/s3/aws4_request`,
      createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    let kSecret = Buffer.from(`AWS4${secretKey}`);
    let kDate = createHmac('sha256', kSecret).update(dateStamp).digest();
    let kRegion = createHmac('sha256', kDate).update(region).digest();
    let kService = createHmac('sha256', kRegion).update('s3').digest();
    let kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    let signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const credential = `${accessKey}/${dateStamp}/${region}/s3/aws4_request`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${credential},SignedHeaders=${signedHeaders},Signature=${signature}`;

    const response = await fetch(fullUrl, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('R2 error:', response.status, response.statusText);
      return new Response(text, {
        status: response.status,
        headers: { 'content-type': 'text/plain' }
      });
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');

    const responseHeaders: Record<string, string> = {
      'content-type': contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=3600',
      'accept-ranges': acceptRanges || 'bytes'
    };

    if (contentLength) {
      responseHeaders['content-length'] = contentLength;
    }

    if (range && response.status === 206) {
      responseHeaders['content-range'] = response.headers.get('content-range') || '';
    }

    return new Response(blob, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (err) {
    const error = err as Error;
    console.error('Media request failed:', error.message);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'content-type': 'text/plain' }
    });
  }
}; 