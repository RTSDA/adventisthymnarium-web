import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import type { Hymn, HymnMetadata, HymnalYear, HymnContent } from '$lib/types/hymn';

const isBrowser = typeof window !== 'undefined';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;
  private initialized = false;
  private initializing = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async verifySchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get list of tables
      const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Available tables:', tables[0].values.flat());

      // Get schema for hymns table
      try {
        const schema = this.db.exec('PRAGMA table_info(hymns)');
        console.log('Schema for hymns:', schema[0].values.map(row => ({
          name: row[1],
          type: row[2],
          notNull: row[3],
          defaultValue: row[4],
          primaryKey: row[5]
        })));

        // Count rows in hymns table
        const countResult = this.db.exec('SELECT COUNT(*) as count FROM hymns');
        console.log('Total hymns in database:', countResult[0].values[0][0]);

        // Check hymnal_type values
        const hymnalTypes = this.db.exec('SELECT DISTINCT hymnal_type FROM hymns');
        console.log('Available hymnal types:', hymnalTypes[0].values.flat());

        // Sample some data
        const sampleResult = this.db.exec('SELECT * FROM hymns LIMIT 1');
        if (sampleResult.length > 0) {
          console.log('Sample hymn:', {
            columns: sampleResult[0].columns,
            values: sampleResult[0].values[0]
          });
        }

        // Count hymns by hymnal_type
        const countByType = this.db.exec('SELECT hymnal_type, COUNT(*) as count FROM hymns GROUP BY hymnal_type');
        console.log('Hymns by type:', countByType[0].values.map(([type, count]) => ({ type, count })));
      } catch (error) {
        console.error('Failed to get schema for hymns:', error);
      }
    } catch (error) {
      console.error('Failed to verify schema:', error);
      throw new Error('Failed to verify database schema');
    }
  }

  private async initialize(): Promise<void> {
    if (!isBrowser) {
      console.log('Skipping initialization - not in browser');
      return;
    }
    if (this.initialized) {
      console.log('Database already initialized');
      return;
    }
    if (this.initializing) {
      console.log('Database initialization in progress, waiting...');
      while (this.initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.initializing = true;
    console.log('Starting database initialization...');

    try {
      // First check if WASM file is accessible
      const wasmResponse = await fetch('/sql-wasm.wasm', { method: 'HEAD' });
      if (!wasmResponse.ok) {
        throw new Error(`WASM file not found: ${wasmResponse.status} ${wasmResponse.statusText}`);
      }
      console.log('WASM file is accessible');

      // Then check if database file is accessible
      const dbResponse = await fetch('/hymnarium.db', { method: 'HEAD' });
      if (!dbResponse.ok) {
        throw new Error(`Database file not found: ${dbResponse.status} ${dbResponse.statusText}`);
      }
      console.log('Database file is accessible');

      console.log('Initializing SQL.js...');
      const SQL = await initSqlJs({
        locateFile: file => {
          console.log('Loading WASM file:', file);
          return `/${file}`;
        }
      });

      console.log('Fetching database file...');
      const response = await fetch('/hymnarium.db');
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('Database file loaded:', uint8Array.length, 'bytes');

      console.log('Creating database instance...');
      this.db = new SQL.Database(uint8Array);
      
      // Verify database content
      await this.verifySchema();
      
      this.initialized = true;
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.db = null;
      this.initialized = false;
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  async getHymn(number: string, hymnalYear: HymnalYear): Promise<Hymn | null> {
    if (!isBrowser) {
      console.log('Not in browser, returning null');
      return null;
    }

    try {
      await this.initialize();
    } catch (error) {
      console.error('Failed to initialize database for getHymn:', error);
      return null;
    }

    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }

    try {
      // Use parameterized query to avoid SQL injection and type issues
      const stmt = this.db.prepare(`
        SELECT number, title, content, hymnal_type as hymnal_year
        FROM hymns 
        WHERE number = ? AND hymnal_type = ?
        LIMIT 1
      `);
      
      stmt.bind([number, hymnalYear]);

      const result = stmt.step();
      if (!result) {
        console.log('No hymn found with params:', { number, hymnalYear });
        stmt.free();
        return null;
      }

      const row = stmt.getAsObject();
      stmt.free();

      if (!row || !row.number || !row.title) {
        console.log('Invalid row data:', row);
        return null;
      }

      /**
       * HYMN PROCESSING RULES - DO NOT CHANGE WITHOUT UNDERSTANDING BOTH FORMATS
       * 
       * 1985 Hymnal (en-newVersion):
       * - Verses come with numbers (e.g. "1.", "2.")
       * - Keep all lines between numbers as one verse
       * - Chorus marked with "CHORUS:" should be one unit
       * - Use the numbers from the content for verse badges
       * 
       * 1941 Hymnal (en-oldVersion):
       * - Verses are separated by double newlines (\n\n)
       * - No verse numbers in content
       * - Use array index + 1 for verse badges
       * - Keep orange styling for old hymnal
       */
      const lyrics = hymnalYear === 'en-oldVersion'
        ? (row.content as string).split('\n\n').map(verse => verse.trim()).filter(verse => verse)  // Split on double newlines for old hymnal
        : this.processNewHymnalLyrics(row.content as string);  // Process new hymnal verses
      
      const hymn = {
        number: row.number.toString(),
        title: row.title as string,
        hymnalYear,
        content: {
          title: row.title as string,
          lyrics
        }
      };

      console.log('Found hymn:', hymn);
      return hymn;
    } catch (error) {
      console.error('Failed to get hymn:', error);
      return null;
    }
  }

  /**
   * Process lyrics for the new (1985) hymnal.
   * IMPORTANT: DO NOT CHANGE THIS LOGIC WITHOUT CAREFUL CONSIDERATION
   * 
   * Rules for new hymnal:
   * 1. Each verse starts with a number (e.g. "1.", "2.")
   * 2. Keep ALL lines between verse numbers together in one verse
   * 3. Chorus is marked with "CHORUS:" and should be kept as one complete unit
   * 4. Chorus should be in its own card with a "C" badge
   * 5. DO NOT split verses or chorus into separate lines/cards
   */
  private processNewHymnalLyrics(content: string): string[] {
    if (!content) return [];

    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const verses: string[] = [];
    let currentVerse: string[] = [];
    let inChorus = false;
    let chorusLines: string[] = [];

    for (const line of lines) {
      // If we find a chorus, collect its lines
      if (line.toLowerCase().includes('chorus:')) {
        // Save any current verse first
        if (currentVerse.length > 0) {
          verses.push(currentVerse.join('\n'));
          currentVerse = [];
        }
        inChorus = true;
        chorusLines = [line];
        continue;
      }

      // Check if this line starts with a verse number
      const verseMatch = line.match(/^(\d+)\./);
      if (verseMatch) {
        // If we were in a chorus, save it
        if (inChorus) {
          verses.push(chorusLines.join('\n'));
          chorusLines = [];
          inChorus = false;
        }
        // If we have a previous verse, save it
        if (currentVerse.length > 0) {
          verses.push(currentVerse.join('\n'));
          currentVerse = [];
        }
        currentVerse.push(line);
      } else {
        // Add line to either chorus or current verse
        if (inChorus) {
          chorusLines.push(line);
        } else {
          currentVerse.push(line);
        }
      }
    }

    // Add the last verse or chorus if we have one
    if (inChorus && chorusLines.length > 0) {
      verses.push(chorusLines.join('\n'));
    } else if (currentVerse.length > 0) {
      verses.push(currentVerse.join('\n'));
    }

    return verses;
  }

  async searchHymns(query: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    if (!isBrowser) return [];

    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      let sql: string;
      let params: any[];

      if (!query) {
        // If no query, return all hymns for the selected hymnal
        sql = `SELECT number, title, hymnal_type as hymnal_year
               FROM hymns 
               WHERE hymnal_type = ?
               ORDER BY CAST(number as INTEGER)`;
        params = [hymnalYear];
      } else {
        // Check if query is a number
        const isNumber = /^\d+$/.test(query.trim());
        
        if (isNumber) {
          // If query is a number, search by exact or partial number match
          sql = `SELECT number, title, hymnal_type as hymnal_year
                 FROM hymns 
                 WHERE hymnal_type = ? AND number LIKE ?
                 ORDER BY CAST(number as INTEGER)`;
          params = [hymnalYear, `${query}%`];
        } else {
          // If query is text, search in title with word boundaries
          const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
          const titleConditions = words.map(() => 'LOWER(title) LIKE ?').join(' AND ');
          
          sql = `SELECT number, title, hymnal_type as hymnal_year
                 FROM hymns 
                 WHERE hymnal_type = ? AND (${titleConditions})
                 ORDER BY 
                   CASE 
                     WHEN LOWER(title) LIKE ? THEN 1
                     ELSE 2
                   END,
                   CAST(number as INTEGER)`;
          
          // Add parameters for each word in the title search
          params = [
            hymnalYear,
            ...words.map(word => `%${word}%`),
            `${query.toLowerCase()}%` // For exact start match in ORDER BY
          ];
        }
      }

      console.log('Executing search:', { sql, params });

      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      const results: HymnMetadata[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          number: row.number as string,
          title: row.title as string,
          hymnalYear: row.hymnal_year as HymnalYear
        });
      }
      stmt.free();

      console.log('Search results:', results);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async getHymnsByCategory(category: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    if (!isBrowser) return [];

    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      `SELECT number, title, hymnal_type as hymnal_year
       FROM hymns 
       WHERE hymnal_type = ?
       ORDER BY CAST(number as INTEGER)`
    );

    stmt.bind([hymnalYear]);

    const results: HymnMetadata[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        number: row.number as string,
        title: row.title as string,
        hymnalYear: row.hymnal_year as HymnalYear
      });
    }
    stmt.free();

    return results;
  }

  async getCategories(hymnalYear: HymnalYear): Promise<string[]> {
    if (!isBrowser) return [];

    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(
      `SELECT DISTINCT category
       FROM hymns 
       WHERE hymnal_type = ?
       ORDER BY category`
    );

    stmt.bind([hymnalYear]);

    const categories: string[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.category) {
        categories.push(row.category as string);
      }
    }
    stmt.free();

    return categories;
  }
}

export const databaseService = DatabaseService.getInstance(); 