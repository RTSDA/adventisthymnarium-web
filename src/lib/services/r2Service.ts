import type { HymnalYear } from '$lib/types/hymn';

/**
 * IMPORTANT: Media Path Rules
 * These paths are locked and should NOT be modified unless explicitly requested:
 * 
 * Audio Files:
 * - New hymnal (en-newVersion): audio/1985/1985/en_XXX.mp3
 * - Old hymnal (en-oldVersion): audio/1985/1941/XXX.mp3
 * 
 * Sheet Music:
 * - New hymnal (en-newVersion): sheet-music/1985/PianoSheet_NewHymnal_en_XXX.png
 * - Old hymnal (en-oldVersion): No sheet music
 */
export class R2Service {
  private static instance: R2Service;
  private baseUrl = '/api/media';

  private constructor() {}

  static getInstance(): R2Service {
    if (!R2Service.instance) {
      R2Service.instance = new R2Service();
    }
    return R2Service.instance;
  }

  private formatHymnNumber(number: string): string {
    return number.padStart(3, '0');
  }

  private getMediaFileName(number: string, hymnalYear: HymnalYear, type: 'audio' | 'sheet-music', pageNumber?: number): string {
    const formattedNumber = this.formatHymnNumber(number);
    if (type === 'audio') {
      return hymnalYear === 'en-oldVersion' 
        ? `${formattedNumber}.mp3`
        : `en_${formattedNumber}.mp3`;
    } else {
      if (hymnalYear === 'en-oldVersion') {
        return '';
      }
      const pageSuffix = pageNumber ? `_${pageNumber}` : '';
      return `PianoSheet_NewHymnal_en_${formattedNumber}${pageSuffix}.png`;
    }
  }

  private getMediaPath(hymnalYear: HymnalYear, type: 'audio' | 'sheet-music'): string {
    if (type === 'audio') {
      return hymnalYear === 'en-oldVersion' 
        ? 'audio/1985/1941'
        : 'audio/1985/1985';
    } else {
      return hymnalYear === 'en-oldVersion'
        ? 'sheet-music/1985/1941'
        : 'sheet-music/1985';  // No second 1985 folder for sheet music
    }
  }

  private async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getMediaUrl(number: string, hymnalYear: HymnalYear, type: 'audio' | 'sheet-music'): Promise<string | undefined> {
    if (type === 'sheet-music' && hymnalYear === 'en-oldVersion') {
      return undefined;
    }

    const fileName = this.getMediaFileName(number, hymnalYear, type);
    const path = this.getMediaPath(hymnalYear, type);
    return `${this.baseUrl}?path=${path}/${fileName}`;
  }

  async getAllSheetMusicUrls(number: string, hymnalYear: HymnalYear): Promise<string[]> {
    if (hymnalYear === 'en-oldVersion') {
      return [];
    }

    const urls: string[] = [];
    const path = this.getMediaPath(hymnalYear, 'sheet-music');

    // First add the base page (without number suffix)
    const baseUrl = `${this.baseUrl}?path=${path}/${this.getMediaFileName(number, hymnalYear, 'sheet-music')}`;
    if (await this.checkUrlExists(baseUrl)) {
      urls.push(baseUrl);
    }

    // Check for additional pages (1 through 5)
    for (let i = 1; i <= 5; i++) {
      const url = `${this.baseUrl}?path=${path}/${this.getMediaFileName(number, hymnalYear, 'sheet-music', i)}`;
      if (await this.checkUrlExists(url)) {
        urls.push(url);
      } else {
        // Stop checking if we get a 404
        break;
      }
    }

    return urls;
  }
}

export const r2Service = R2Service.getInstance(); 