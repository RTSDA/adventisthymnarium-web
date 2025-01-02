import type { Hymn, HymnMetadata, HymnalYear } from '$lib/types/hymn';
import { DatabaseService } from './databaseService';
import { r2Service } from './r2Service';

export class HymnalService {
  private static instance: HymnalService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  static getInstance(): HymnalService {
    if (!HymnalService.instance) {
      HymnalService.instance = new HymnalService();
    }
    return HymnalService.instance;
  }

  async getHymn(number: string, hymnalYear: HymnalYear): Promise<Hymn | null> {
    try {
      const hymn = await this.databaseService.getHymn(number, hymnalYear);
      if (!hymn) return null;

      // Add media URLs
      try {
        const [audioUrl, sheetMusicUrl] = await Promise.all([
          r2Service.getMediaUrl(number, hymnalYear, 'audio'),
          r2Service.getMediaUrl(number, hymnalYear, 'sheet-music')
        ]);

        console.log('Loaded hymn with media:', {
          number,
          hymnalYear,
          title: hymn.title,
          audioUrl,
          sheetMusicUrl,
          content: hymn.content
        });

        return {
          ...hymn,
          audioUrl,
          sheetMusicUrl
        };
      } catch (error) {
        console.warn('Failed to fetch media URLs:', error);
      }

      // Return hymn without media URLs if media fetching fails
      return hymn;
    } catch (error) {
      console.error('Failed to get hymn:', error);
      return null;
    }
  }

  async searchHymns(query: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    return this.databaseService.searchHymns(query, hymnalYear);
  }

  async getHymnsByCategory(category: string, hymnalYear: HymnalYear): Promise<HymnMetadata[]> {
    return this.databaseService.getHymnsByCategory(category, hymnalYear);
  }

  async getCategories(hymnalYear: HymnalYear): Promise<string[]> {
    return this.databaseService.getCategories(hymnalYear);
  }
}

export const hymnalService = HymnalService.getInstance(); 