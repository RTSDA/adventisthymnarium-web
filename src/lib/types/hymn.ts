export type HymnalYear = 'en-newVersion' | 'en-oldVersion';

export interface HymnContent {
  title: string;
  lyrics: string[];
}

export interface Hymn {
  number: string;
  title: string;
  hymnalYear: HymnalYear;
  content: HymnContent;
  audioUrl?: string;
  sheetMusicUrl?: string;
}

export interface HymnMetadata {
  number: string;
  title: string;
  hymnalYear: HymnalYear;
}

export interface HymnalSection {
  title: string;
  startNumber: number;
  endNumber: number;
  hymnalYear: HymnalYear;
}

export interface ThematicList {
  id: number;
  title: string;
  hymns: string[];
  hymnalYear: HymnalYear;
}

export interface ThematicAmbit {
  id: number;
  title: string;
  startNumber: number;
  endNumber: number;
  hymnalYear: HymnalYear;
} 