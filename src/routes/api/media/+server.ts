import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  if (!platform?.env) throw error(500, 'Platform environment not available');

  const path = url.searchParams.get('path');
  if (!path) throw error(400, 'Path parameter is required');

  try {
    const object = await platform.env.BUCKET.get(path);
    if (!object) throw error(404, 'File not found');

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.httpEtag
      }
    });
  } catch (e) {
    console.error('Failed to fetch from R2:', e);
    throw error(500, 'Failed to fetch media');
  }
}; 