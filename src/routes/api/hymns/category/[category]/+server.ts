import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface HymnRow {
  number: string;
  title: string;
  hymnal_type: string;
}

export const GET = (async ({ params, url, platform }) => {
  if (!platform) throw error(500, 'Platform not available');

  const hymnalYear = url.searchParams.get('hymnalYear');
  if (!hymnalYear) {
    throw error(400, 'hymnalYear is required');
  }

  try {
    const { results } = await platform.env.DB.prepare(`
      SELECT h.number, h.title, h.hymnal_type
      FROM hymns h
      JOIN thematic_ambits ta ON h.number >= ta.start_number AND h.number <= ta.end_number
      JOIN thematic_lists tl ON ta.thematic_list_id = tl.id
      WHERE tl.thematic = ? AND h.hymnal_type = ?
      ORDER BY CAST(h.number as INTEGER)
    `)
    .bind(params.category, hymnalYear)
    .all<HymnRow>();

    return json(results || []);
  } catch (e) {
    console.error('Error fetching hymns by category:', e);
    throw error(500, 'Internal server error');
  }
}) satisfies RequestHandler; 