import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, platform }) => {
  if (!platform) throw error(500, 'Platform not available');

  const query = url.searchParams.get('q') || '';
  const hymnalYear = url.searchParams.get('hymnalYear');
  
  if (!hymnalYear) {
    throw error(400, 'hymnalYear is required');
  }

  try {
    let stmt;
    
    if (!query) {
      // If no query, return all hymns for the selected hymnal
      stmt = platform.env.DB.prepare(
        'SELECT number, title, hymnal_type FROM hymns WHERE hymnal_type = ? ORDER BY CAST(number as INTEGER)'
      ).bind(hymnalYear);
    } else if (/^\d+$/.test(query.trim())) {
      // If query is a number, search by exact or partial number match
      stmt = platform.env.DB.prepare(
        'SELECT number, title, hymnal_type FROM hymns WHERE hymnal_type = ? AND number LIKE ? ORDER BY CAST(number as INTEGER)'
      ).bind(hymnalYear, `${query}%`);
    } else {
      // If query is text, search in title
      const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const titleConditions = words.map(() => 'LOWER(title) LIKE ?').join(' AND ');
      
      const sql = `SELECT number, title, hymnal_type 
                  FROM hymns 
                  WHERE hymnal_type = ? AND (${titleConditions})
                  ORDER BY 
                    CASE WHEN LOWER(title) LIKE ? THEN 1 ELSE 2 END,
                    CAST(number as INTEGER)`;
      
      stmt = platform.env.DB.prepare(sql).bind(
        hymnalYear,
        ...words.map(word => `%${word}%`),
        `${query.toLowerCase()}%`
      );
    }

    const { results } = await stmt.all();
    return json(results || []);
  } catch (e) {
    console.error('Error searching hymns:', e);
    throw error(500, 'Internal server error');
  }
}) satisfies RequestHandler; 