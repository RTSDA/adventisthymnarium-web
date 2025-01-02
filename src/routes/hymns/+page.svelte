<script lang="ts">
  import { hymnalService } from '$lib/services/hymnalService';
  import { currentHymnalYear } from '$lib/stores/hymns';
  import type { HymnMetadata } from '$lib/types/hymn';
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let searchQuery = '';
  let loading = false;
  let error: string | null = null;
  let hymns: HymnMetadata[] = [];
  let searchInput: HTMLInputElement;
  let touchStartY = 0;
  let pullDistance = 0;
  let isPulling = false;

  async function handleSearch() {
    loading = true;
    error = null;
    try {
      hymns = await hymnalService.searchHymns(searchQuery, $currentHymnalYear);
    } catch (err) {
      console.error('Failed to search hymns:', err);
      error = 'Failed to search hymns. Please try again.';
    } finally {
      loading = false;
    }
  }

  function clearSearch() {
    searchQuery = '';
    searchInput.focus();
    handleSearch();
  }

  function handleTouchStart(e: TouchEvent) {
    if (window.scrollY === 0) {
      touchStartY = e.touches[0].clientY;
      isPulling = true;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (isPulling) {
      const touch = e.touches[0];
      pullDistance = Math.max(0, Math.min(150, touch.clientY - touchStartY));
      if (pullDistance > 0) {
        e.preventDefault();
      }
    }
  }

  async function handleTouchEnd() {
    if (pullDistance > 100) {
      await handleSearch();
    }
    pullDistance = 0;
    isPulling = false;
  }

  // Initial load
  handleSearch();

  // Reload when hymnal changes
  $: if ($currentHymnalYear) {
    handleSearch();
  }
</script>

<div 
  class="hymns-container"
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
  style="transform: translateY({pullDistance}px)"
>
  {#if pullDistance > 0}
    <div class="pull-indicator" style="opacity: {pullDistance / 150}">
      {pullDistance > 100 ? 'Release to refresh' : 'Pull to refresh'}
    </div>
  {/if}

  <div class="page-header" transition:slide>
    <h1>Hymns</h1>
    <div class="hymnal-selector">
      <button 
        class:active={$currentHymnalYear === 'en-newVersion'}
        on:click={() => currentHymnalYear.set('en-newVersion')}
      >
        <span>1985 Hymnal</span>
      </button>
      <button 
        class:active={$currentHymnalYear === 'en-oldVersion'}
        on:click={() => currentHymnalYear.set('en-oldVersion')}
      >
        <span>1941 Hymnal</span>
      </button>
    </div>
  </div>

  <div class="search-section" transition:slide>
    <div class="search-input-container">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="none" stroke="currentColor" stroke-width="2" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
      </svg>
      <input
        type="text"
        placeholder="Search by number or title..."
        bind:value={searchQuery}
        bind:this={searchInput}
        on:input={handleSearch}
      />
      {#if searchQuery}
        <button class="clear-button" on:click={clearSearch}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="hymns-grid" transition:fade>
      {#each Array(6) as _}
        <div class="hymn-card skeleton">
          <div class="skeleton-number"></div>
          <div class="skeleton-title"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="error" transition:fade>
      <p>{error}</p>
      <button class="retry-button" on:click={handleSearch}>Retry</button>
    </div>
  {:else if hymns.length === 0}
    <div class="no-results" transition:fade>No hymns found</div>
  {:else}
    <div class="hymns-grid" transition:fade>
      {#each hymns as hymn (hymn.number)}
        <a 
          href="/hymns/{hymn.number}" 
          class="hymn-card"
          transition:slide|local={{ duration: 300, easing: quintOut }}
        >
          <span class="hymn-number">#{hymn.number}</span>
          <span class="hymn-title">{hymn.title}</span>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hymns-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    transition: transform 0.2s ease;
  }

  .pull-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 1rem;
    color: #666;
    font-size: 0.9rem;
    pointer-events: none;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem 0;
    color: #333;
  }

  .hymnal-selector {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .hymnal-selector button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 0.5rem;
    background: #f5f5f5;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .hymnal-selector button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    transition: transform 0.3s ease-out;
  }

  .hymnal-selector button:active::after {
    transform: translate(-50%, -50%) scale(2);
  }

  .hymnal-selector button.active {
    background: #2196f3;
    color: white;
  }

  .search-section {
    margin-bottom: 2rem;
  }

  .search-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    color: #666;
  }

  input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    font-size: 1.1rem;
    border: 2px solid #eee;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    -webkit-appearance: none;
  }

  input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  .clear-button {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    padding: 0.5rem;
    color: #666;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .clear-button:active {
    background: rgba(0, 0, 0, 0.1);
  }

  .hymns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .hymn-card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .hymn-card::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.05);
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    transition: transform 0.3s ease-out;
  }

  .hymn-card:active::after {
    transform: translate(-50%, -50%) scale(2);
  }

  .hymn-card.skeleton {
    pointer-events: none;
  }

  .skeleton-number {
    width: 40px;
    height: 16px;
    background: #eee;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    animation: pulse 1.5s infinite;
  }

  .skeleton-title {
    width: 80%;
    height: 20px;
    background: #eee;
    border-radius: 4px;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }

  .hymn-number {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .hymn-title {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .loading, .error, .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .retry-button {
    margin-top: 1rem;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:active {
    background: #1976d2;
  }

  @media (max-width: 600px) {
    .hymns-container {
      padding: 0.5rem;
    }

    h1 {
      font-size: 2rem;
    }

    .hymnal-selector {
      flex-direction: column;
      padding: 0 1rem;
    }

    .hymnal-selector button {
      width: 100%;
    }

    .search-section {
      padding: 0 1rem;
    }

    input {
      font-size: 1rem;
      padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    }

    .search-icon {
      left: 0.75rem;
    }

    .hymns-grid {
      grid-template-columns: 1fr;
      padding: 0 1rem;
    }

    .hymn-card {
      padding: 1rem;
    }
  }
</style> 