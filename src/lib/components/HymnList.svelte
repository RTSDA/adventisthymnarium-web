<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { HymnMetadata } from '$lib/types/hymn';
  import { databaseService } from '$lib/services/databaseService';
  import { currentHymnalYear } from '$lib/stores/hymns';

  const dispatch = createEventDispatcher();
  let searchQuery = '';
  let hymns: HymnMetadata[] = [];
  let searchTimeout: NodeJS.Timeout | null = null;
  let loading = false;

  async function performSearch() {
    loading = true;
    try {
      hymns = await databaseService.searchHymns(searchQuery.trim(), $currentHymnalYear);
    } catch (error) {
      console.error('Search failed:', error);
      hymns = [];
    } finally {
      loading = false;
    }
  }

  // Load initial hymns
  onMount(() => {
    performSearch();
  });

  // Watch for changes in search query
  $: if (searchQuery !== undefined) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(performSearch, 300);
  }

  // Watch for changes in hymnal year
  $: if ($currentHymnalYear) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    performSearch();
  }
</script>

<div class="hymn-list">
  <div class="search-bar">
    <input
      type="text"
      placeholder="Search by number or title..."
      bind:value={searchQuery}
      class:searching={loading}
    />
    {#if loading}
      <div class="loading-indicator">Searching...</div>
    {/if}
  </div>

  <div class="results">
    {#if hymns.length === 0}
      <p class="no-results">
        {searchQuery ? 'No hymns found matching your search' : 'Enter a hymn number or title to search'}
      </p>
    {:else}
      {#each hymns as hymn}
        <button
          class="hymn-item"
          on:click={() => dispatch('hymnSelect', hymn)}
        >
          <span class="number">#{hymn.number}</span>
          <span class="title">{hymn.title}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .hymn-list {
    width: 100%;
  }

  .search-bar {
    margin-bottom: 2rem;
    position: relative;
  }

  input {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  input.searching {
    background-color: #f8f9ff;
  }

  .loading-indicator {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9rem;
    color: #666;
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .hymn-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .hymn-item:hover {
    background: #f8f9ff;
    border-color: #2196f3;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.1);
  }

  .number {
    font-weight: 500;
    color: #2196f3;
    min-width: 3rem;
  }

  .title {
    flex: 1;
    color: #333;
  }

  .no-results {
    text-align: center;
    color: #666;
    padding: 2rem;
    background: #f8f9ff;
    border-radius: 8px;
    border: 1px dashed #ddd;
  }
</style> 