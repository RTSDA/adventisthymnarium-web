import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ params, url, platform }) => {
  if (!platform) throw error(500, 'Platform not available');
  
  const hymnalYear = url.searchParams.get('hymnalYear');
  if (!hymnalYear) {
    throw error(400, 'hymnalYear is required');
  }

  try {
    const { results } = await platform.env.DB.prepare(
      'SELECT number, title, content, hymnal_type FROM hymns WHERE number = ? AND hymnal_type = ? LIMIT 1'
    )
    .bind(params.number, hymnalYear)
    .all();

    if (!results || results.length === 0) {
      throw error(404, 'Hymn not found');
    }

    return json(results[0]);
  } catch (e) {
    console.error('Error fetching hymn:', e);
    throw error(500, 'Internal server error');
  }
}) satisfies RequestHandler; 