import type { Hymn, HymnMetadata, HymnalYear, HymnContent } from '$lib/types/hymn';

interface HymnRow {
  number: string | number;
  title: string;
  content: string;
  hymnal_type: string;
}

interface HymnSearchRow {
  number: string | number;
  title: string;
  hymnal_type: string;
}

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getHymn(number: string, hymnalYear: HymnalYear): Promise<Hymn | null> {
    try {
      const response = await fetch(`/api/hymn/${number}?hymnalYear=${hymnalYear}`);
      if (!response.ok) {
        console.error('Failed to fetch hymn:', response.statusText);
        return null;
      }

      const data = await response.json() as HymnRow;
      if (!data) return null;

      const hymn = {
        number: data.number.toString(),
        title: data.title,
        hymnalYear,
        content: {
          title: data.title,
          lyrics: hymnalYear === 'en-oldVersion'
            ? data.content.split('\n\n').map((verse: string) => verse.trim()).filter((verse: string) => verse)
            : this.processNewHymnalLyrics(data.content)
        }
      };

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

      // If we find a new verse number while in chorus, save the chorus
      if (inChorus && /^\d+\./.test(line)) {
        if (chorusLines.length > 0) {
          verses.push(chorusLines.join('\n'));
          chorusLines = [];
        }
        inChorus = false;
        currentVerse = [line];
        continue;
      }

      // If we're in chorus mode, add to chorus lines
      if (inChorus) {
        chorusLines.push(line);
        continue;
      }

      // If we find a new verse number, save the current verse and start a new one
      if (/^\d+\./.test(line)) {
        if (currentVerse.length > 0) {
          verses.push(currentVerse.join('\n'));
        }
        currentVerse = [line];
      } else {
        // Otherwise add to current verse
        currentVerse.push(line);
      }
    }

    // Save any remaining verse or chorus
    if (inChorus && chorusLines.length > 0) {
      verses.push(chorusLines.join('\n'));
    } else if (currentVerse.length > 0) {
      verses.push(currentVerse.join('\n'));
    }

    return verses;
  }

  async searchHymns(query: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    try {
      const response = await fetch(`/api/hymns/search?q=${encodeURIComponent(query)}&hymnalYear=${hymnalYear}`);
      if (!response.ok) {
        console.error('Failed to search hymns:', response.statusText);
        return [];
      }

      const data = await response.json() as HymnSearchRow[];
      return data.map(hymn => ({
        number: hymn.number.toString(),
        title: hymn.title,
        hymnalYear
      }));
    } catch (error) {
      console.error('Failed to search hymns:', error);
      return [];
    }
  }

  async getHymnsByCategory(category: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    try {
      const response = await fetch(`/api/hymns/category/${encodeURIComponent(category)}?hymnalYear=${hymnalYear}`);
      if (!response.ok) {
        console.error('Failed to get hymns by category:', response.statusText);
        return [];
      }

      const data = await response.json() as HymnSearchRow[];
      return data.map(hymn => ({
        number: hymn.number.toString(),
        title: hymn.title,
        hymnalYear
      }));
    } catch (error) {
      console.error('Failed to get hymns by category:', error);
      return [];
    }
  }

  async getCategories(hymnalYear: HymnalYear): Promise<string[]> {
    try {
      const response = await fetch(`/api/categories?hymnalYear=${hymnalYear}`);
      if (!response.ok) {
        console.error('Failed to get categories:', response.statusText);
        return [];
      }

      return await response.json() as string[];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }
}

export const databaseService = DatabaseService.getInstance(); 