import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  if (!platform?.env) throw error(500, 'Platform environment not available');

  const path = url.searchParams.get('path');
  if (!path) throw error(400, 'Path parameter is required');

  try {
    console.log('Attempting to fetch from R2:', { path });

    // Check if we have the R2 binding
    if (!platform.env.BUCKET) {
      console.error('R2 bucket binding not found. Available env:', platform.env);
      throw error(500, 'R2 bucket binding not found');
    }

    // Get the object from R2
    const object = await platform.env.BUCKET.get(path);
    
    // If object doesn't exist, return 404
    if (!object) {
      console.error('File not found in R2:', { path });
      throw error(404, 'File not found');
    }

    // Get the object's data
    const data = await object.arrayBuffer();
    
    // Return the response with appropriate headers
    return new Response(data, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
      }
    });
  } catch (e) {
    console.error('Failed to fetch from R2:', { path, error: e });
    if (e instanceof Error && e.message === 'File not found') {
      throw error(404, 'File not found');
    }
    throw error(500, 'Failed to fetch media');
  }
}; 