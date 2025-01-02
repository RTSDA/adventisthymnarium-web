import { dev } from '$app/environment';
import { error, type Handle } from '@sveltejs/kit';

let devDb: any = null;

if (dev) {
  // Only import better-sqlite3 in development
  const { default: Database } = await import('better-sqlite3');
  devDb = new Database('static/hymnarium.db');
}

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