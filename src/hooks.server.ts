import { dev } from '$app/environment';
import { error, type Handle } from '@sveltejs/kit';
import Database from 'better-sqlite3';

// Create a development database connection
const devDb = dev ? new Database('static/hymnarium.db') : null;

export const handle: Handle = async ({ event, resolve }) => {
  // In development, we'll use better-sqlite3 to access the local database
  if (dev) {
    event.platform = {
      env: {
        DB: {
          prepare: (query: string) => {
            const stmt = devDb!.prepare(query);
            return {
              bind: (...params: any[]) => ({
                all: <T = any>() => {
                  try {
                    const results = stmt.all(...params) as T[];
                    return { results };
                  } catch (e) {
                    console.error('Database error:', e);
                    throw error(500, 'Database error');
                  }
                }
              })
            };
          }
        } as any
      }
    };
  }

  return await resolve(event);
}; 