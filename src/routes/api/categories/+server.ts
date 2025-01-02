import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ThematicRow {
  thematic: string;
}

export const GET = (async ({ url, platform }) => {
  if (!platform) throw error(500, 'Platform not available');

  const hymnalYear = url.searchParams.get('hymnalYear');
  if (!hymnalYear) {
    throw error(400, 'hymnalYear is required');
  }

  try {
    const { results } = await platform.env.DB.prepare(
      'SELECT DISTINCT thematic FROM thematic_lists WHERE hymnal_type = ? ORDER BY thematic'
    )
    .bind(hymnalYear)
    .all<ThematicRow>();

    return json(results?.map(row => row.thematic) || []);
  } catch (e) {
    console.error('Error fetching categories:', e);
    throw error(500, 'Internal server error');
  }
}) satisfies RequestHandler; 