<script lang="ts">
  import { currentHymnalYear } from '$lib/stores/hymns';
  import { hymnalService } from '$lib/services/hymnalService';
  import { r2Service } from '$lib/services/r2Service';
  import { onMount } from 'svelte';
  import type { Hymn } from '$lib/types/hymn';
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import { fade, fly } from 'svelte/transition';

  export let data: { number: string };

  let loading = true;
  let error: string | null = null;
  let hymn: Hymn | null = null;
  let sheetMusicUrls: string[] = [];
  let currentSheetMusicIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let pullToRefreshActive = false;
  let pullDistance = 0;
  let contentElement: HTMLElement;

  async function loadHymn() {
    loading = true;
    error = null;
    try {
      hymn = await hymnalService.getHymn(data.number, $currentHymnalYear);
      if (!hymn) {
        throw new Error('Hymn not found');
      }
      sheetMusicUrls = await r2Service.getAllSheetMusicUrls(data.number, $currentHymnalYear);
    } catch (err) {
      console.error('Failed to load hymn:', err);
      error = 'Failed to load the hymn. Please try again.';
    } finally {
      loading = false;
      pullToRefreshActive = false;
      pullDistance = 0;
    }
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!contentElement) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Only handle vertical pull when at top of content
    if (contentElement.scrollTop === 0 && deltaY > 0) {
      pullDistance = Math.min(deltaY * 0.5, 150);
      pullToRefreshActive = pullDistance > 100;
      e.preventDefault();
    }
  }

  function handleTouchEnd() {
    if (pullToRefreshActive) {
      loadHymn();
    }
    pullDistance = 0;
  }

  function nextSheetMusic() {
    if (currentSheetMusicIndex < sheetMusicUrls.length - 1) {
      currentSheetMusicIndex++;
    }
  }

  function previousSheetMusic() {
    if (currentSheetMusicIndex > 0) {
      currentSheetMusicIndex--;
    }
  }

  onMount(loadHymn);

  $: if ($currentHymnalYear) {
    loadHymn();
  }
</script>

<div 
  class="hymn-page"
  bind:this={contentElement}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
  {#if pullDistance > 0}
    <div 
      class="pull-to-refresh" 
      style="height: {pullDistance}px"
      transition:fade
    >
      <div class="pull-indicator" class:active={pullToRefreshActive}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        <span>{pullToRefreshActive ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading-container" in:fade>
      <div class="loading-spinner"></div>
      <p>Loading hymn...</p>
    </div>
  {:else if error}
    <div class="error-container" in:fade>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
        <path fill="#d32f2f" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <h1>Error Loading Hymn</h1>
      <p>{error}</p>
      <button class="retry-button" on:click={loadHymn}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        Retry
      </button>
    </div>
  {:else if hymn}
    <div class="hymn-content" in:fade={{ duration: 200 }}>
      <header class="hymn-header">
        <div class="header-content">
          <h1>{hymn.title}</h1>
          <div class="hymnal-info">
            <div class="hymn-number">#{hymn.number}</div>
            <div class="hymnal-badge" class:new-hymnal={hymn.hymnalYear === 'en-newVersion'}>
              {hymn.hymnalYear === 'en-newVersion' ? '1985 Hymnal' : '1941 Hymnal'}
            </div>
          </div>
        </div>
      </header>

      <div class="content-container">
        {#if sheetMusicUrls.length > 0}
          <section class="sheet-music-section" in:fly={{ y: 20, duration: 300, delay: 100 }}>
            <div class="sheet-music-container">
              <img 
                src={sheetMusicUrls[currentSheetMusicIndex]} 
                alt="Sheet music for {hymn.title}"
                class="sheet-music"
              />
              {#if sheetMusicUrls.length > 1}
                <div class="page-navigation">
                  <button 
                    class="nav-button" 
                    disabled={currentSheetMusicIndex === 0}
                    on:click={previousSheetMusic}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                    Previous
                  </button>
                  <span class="page-info">
                    Page {currentSheetMusicIndex + 1} of {sheetMusicUrls.length}
                  </span>
                  <button 
                    class="nav-button" 
                    disabled={currentSheetMusicIndex === sheetMusicUrls.length - 1}
                    on:click={nextSheetMusic}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M10.02 6L8.61 7.41 13.19 12l-4.58 4.59L10.02 18l6-6z"/>
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        {#if hymn.audioUrl}
          <section class="audio-section" in:fly={{ y: 20, duration: 300, delay: 200 }}>
            <AudioPlayer 
              src={hymn.audioUrl} 
            />
          </section>
        {/if}

        <section class="lyrics-section">
          {#each hymn.content.lyrics as verse, i}
            <div 
              class="verse-card" 
              class:chorus={verse.toLowerCase().includes('chorus:')} 
              class:old-hymnal={hymn.hymnalYear === 'en-oldVersion'}
              in:fly={{ y: 20, duration: 300, delay: 300 + i * 100 }}
            >
              <div class="verse-number">
                {#if verse.toLowerCase().includes('chorus:')}
                  C
                {:else if hymn.hymnalYear === 'en-oldVersion'}
                  {i + 1}
                {:else}
                  {verse.match(/^(\d+)/)?.[1] || '1'}
                {/if}
              </div>
              <div class="verse-text">
                <p>{verse.replace(/^(\d+\.|CHORUS:)/i, '').trim()}</p>
              </div>
            </div>
          {/each}
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .hymn-page {
    min-height: 100vh;
    background: #f8f9fa;
    padding-top: 0; /* Remove top padding since header is not fixed anymore */
  }

  .hymn-header {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    margin-bottom: 1.5rem;
  }

  .content-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  @media (max-width: 768px) {
    .hymn-header {
      padding: 1rem 0;
      margin-bottom: 1rem;
    }

    .content-container {
      padding: 0 0.75rem;
    }
  }

  .header-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem;
    color: #333;
  }

  .hymnal-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .hymn-number {
    font-size: 1.1rem;
    color: #666;
    font-weight: 500;
  }

  .hymnal-badge {
    background: #ff9800;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .hymnal-badge.new-hymnal {
    background: #2196f3;
  }

  .content-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .sheet-music-section {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .sheet-music-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    width: 100%;
    max-width: 900px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .sheet-music {
    width: 100%;
    height: auto;
    display: block;
  }

  .page-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 0.9rem;
    color: #666;
    min-width: 100px;
    text-align: center;
  }

  .audio-section {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .lyrics-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .verse-card {
    background: white;
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .verse-number {
    position: absolute;
    top: -0.875rem;
    left: -0.875rem;
    background: #2196f3;
    color: white;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
    z-index: 1;
  }

  .verse-text {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #333;
  }

  .verse-text p {
    margin: 0;
    white-space: pre-line;
  }

  .verse-card.chorus {
    background: #f8f9ff;
    border-left: 4px solid #2196f3;
  }

  .verse-card.chorus .verse-number {
    background: #1976d2;
  }

  .verse-card.old-hymnal {
    background: #fff9f0;
    border-left: 4px solid #ff9800;
  }

  .verse-card.old-hymnal .verse-number {
    background: #ff9800;
  }

  @media (max-width: 768px) {
    .hymn-header {
      top: 56px;
      padding: 1.25rem 0;
    }

    .header-content {
      padding: 0.75rem 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .content-container {
      padding: 0 0.75rem;
      padding-top: calc(56px + 90px);
    }

    .sheet-music-container {
      padding: 1rem;
      border-radius: 0.75rem;
    }

    .audio-section {
      padding: 0.75rem;
      border-radius: 0.75rem;
    }

    .verse-card {
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
    }

    .nav-button {
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
    }
  }
</style> 