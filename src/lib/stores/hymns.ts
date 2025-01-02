import { writable } from 'svelte/store';
import type { Hymn, HymnalYear } from '$lib/types/hymn';
import { hymnalService } from '$lib/services/hymnalService';

const isBrowser = typeof window !== 'undefined';
const CACHE_KEY = 'hymnarium-cache';
const CACHE_VERSION = 1;

// Get the initial hymnal year from localStorage or default to new version
const storedHymnalYear = isBrowser ? localStorage.getItem('currentHymnalYear') : null;
const initialHymnalYear = (storedHymnalYear as HymnalYear) || 'en-newVersion';

export const currentHymnalYear = writable<HymnalYear>(initialHymnalYear);

// Subscribe to changes and update localStorage
if (isBrowser) {
  currentHymnalYear.subscribe(value => {
    localStorage.setItem('currentHymnalYear', value);
  });
}

interface HymnStore {
  hymns: Map<string, Hymn>;
  lastUpdated?: number;
}

interface CacheEntry {
  hymn: Hymn;
  timestamp: number;
}

async function loadFromCache(key: string): Promise<Hymn | null> {
  if (!isBrowser) return null;
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}-${key}`);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    // Cache expires after 24 hours
    if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${CACHE_KEY}-${key}`);
      return null;
    }
    return entry.hymn;
  } catch {
    return null;
  }
}

async function saveToCache(key: string, hymn: Hymn) {
  if (!isBrowser) return;
  try {
    const entry: CacheEntry = {
      hymn,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY}-${key}`, JSON.stringify(entry));
  } catch {
    // If storage is full, clear old entries
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_KEY));
      cacheKeys.forEach(k => localStorage.removeItem(k));
      // Try saving again
      localStorage.setItem(`${CACHE_KEY}-${key}`, JSON.stringify({ hymn, timestamp: Date.now() }));
    } catch {
      // If still fails, just ignore
      console.warn('Failed to cache hymn:', key);
    }
  }
}

function createHymnStore() {
  const { subscribe, set, update } = writable<HymnStore>({
    hymns: new Map(),
    lastUpdated: Date.now()
  });

  return {
    subscribe,
    async loadHymn(number: string, hymnalYear: HymnalYear) {
      const key = `${hymnalYear}-${number}`;
      
      // First try to load from memory
      let hymn = null;
      update(store => {
        hymn = store.hymns.get(key);
        return store;
      });
      if (hymn) return;

      // Then try to load from cache
      hymn = await loadFromCache(key);
      if (hymn) {
        update(store => {
          store.hymns.set(key, hymn!);
          return store;
        });
        return;
      }

      // Finally try to load from service
      try {
        hymn = await hymnalService.getHymn(number, hymnalYear);
        if (!hymn) return;

        // Save to both memory and cache
        update(store => {
          store.hymns.set(key, hymn!);
          store.lastUpdated = Date.now();
          return store;
        });
        await saveToCache(key, hymn);
      } catch (error) {
        console.error('Failed to load hymn:', error);
        // If offline, try to load from cache one last time
        if (!navigator.onLine) {
          hymn = await loadFromCache(key);
          if (hymn) {
            update(store => {
              store.hymns.set(key, hymn!);
              return store;
            });
          }
        }
      }
    }
  };
}

export const hymnStore = createHymnStore(); 