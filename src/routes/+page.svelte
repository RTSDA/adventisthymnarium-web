{#if loading}
  <div class="loading">Loading...</div>
{:else if error}
  <div class="error-container">
    <h1>Unable to Load Hymnarium</h1>
    <p>{error}</p>
    <button class="retry-button" on:click={initialize}>Retry</button>
  </div>
{:else}
  <div class="home-container">
    <section class="hero">
      <h1>Welcome to Adventist Hymnarium</h1>
      <p class="subtitle">Explore and sing along with beloved Adventist hymns</p>
    </section>

    <section class="search-section">
      <h2>Find a Hymn</h2>
      <div class="search-container">
        <input 
          type="text" 
          placeholder="Search by number or title..." 
          bind:value={searchQuery}
          on:input={handleSearch}
        />
        <div class="hymnal-selector">
          <button 
            class="hymnal-button" 
            class:active={$currentHymnalYear === 'en-newVersion'}
            on:click={() => currentHymnalYear.set('en-newVersion')}
          >
            1985 Hymnal
          </button>
          <button 
            class="hymnal-button" 
            class:active={$currentHymnalYear === 'en-oldVersion'}
            on:click={() => currentHymnalYear.set('en-oldVersion')}
          >
            1941 Hymnal
          </button>
        </div>
      </div>

      <div class="results-container">
        {#if searchResults.length > 0}
          {#each searchResults as hymn}
            <a 
              href="/hymns/{hymn.number}" 
              class="hymn-card"
            >
              <span class="hymn-number">#{hymn.number}</span>
              <span class="hymn-title">{hymn.title}</span>
            </a>
          {/each}
        {:else if searchQuery}
          <p class="no-results">No hymns found</p>
        {:else}
          <div class="quick-access">
            <h3>Quick Access</h3>
            <div class="popular-hymns">
              {#each popularHymns as hymn}
                <a 
                  href="/hymns/{hymn.number}" 
                  class="hymn-card popular"
                >
                  <span class="hymn-number">#{hymn.number}</span>
                  <span class="hymn-title">{hymn.title}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>
  </div>
{/if}

<style>
  .home-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .hero {
    text-align: center;
    padding: 2rem 1rem;
    margin-bottom: 2rem;
    background: linear-gradient(to right, #2196f3, #1976d2);
    color: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .hero h1 {
    font-size: 2.5rem;
    margin: 0;
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0;
  }

  .search-section {
    padding: 1rem;
  }

  .search-section h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #333;
  }

  .search-container {
    margin-bottom: 2rem;
  }

  input {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    transition: border-color 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .hymnal-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .hymnal-button {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    border: none;
    border-radius: 0.5rem;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .hymnal-button.active {
    background: #2196f3;
    color: white;
  }

  .hymn-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .hymn-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .hymn-number {
    font-weight: 500;
    color: #2196f3;
    margin-right: 1rem;
    min-width: 3rem;
  }

  .hymn-title {
    font-size: 1.1rem;
  }

  .quick-access {
    margin-top: 2rem;
  }

  .quick-access h3 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .popular-hymns {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .hymn-card.popular {
    background: #f8f9ff;
  }

  .no-results {
    text-align: center;
    color: #666;
    padding: 2rem;
  }

  @media (max-width: 600px) {
    .hero h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .search-section h2 {
      font-size: 1.5rem;
    }

    .hymn-card {
      padding: 0.75rem;
    }

    .hymn-title {
      font-size: 1rem;
    }
  }

  .error-container {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    background: #fff3f3;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .error-container h1 {
    color: #d32f2f;
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }

  .error-container p {
    color: #666;
    margin-bottom: 2rem;
  }

  .retry-button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background: #1976d2;
    transform: translateY(-1px);
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    font-size: 1.2rem;
    color: #666;
  }
</style>

<script lang="ts">
  import { currentHymnalYear } from '$lib/stores/hymns';
  import { hymnalService } from '$lib/services/hymnalService';
  import type { HymnMetadata } from '$lib/types/hymn';
  import { onMount } from 'svelte';

  function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  let loading = true;
  let error: string | null = null;
  let searchQuery = '';
  let searchResults: HymnMetadata[] = [];
  let popularHymns: HymnMetadata[] = [];

  const handleSearch = debounce(async () => {
    try {
      if (searchQuery.trim()) {
        searchResults = await hymnalService.searchHymns(searchQuery, $currentHymnalYear);
      } else {
        searchResults = [];
      }
    } catch (err) {
      console.error('Search failed:', err);
      error = 'Failed to search hymns. Please try again.';
    }
  }, 300);

  async function loadPopularHymns() {
    try {
      // Load first 6 hymns as popular ones for now
      popularHymns = await hymnalService.searchHymns('', $currentHymnalYear);
      popularHymns = popularHymns.slice(0, 6);
    } catch (err) {
      console.error('Failed to load popular hymns:', err);
      error = 'Failed to load hymns. Please try again.';
    }
  }

  async function initialize() {
    loading = true;
    error = null;
    try {
      await loadPopularHymns();
    } catch (err) {
      console.error('Initialization failed:', err);
      error = 'Unable to load the hymnal database. Please check your connection and try again.';
    } finally {
      loading = false;
    }
  }

  onMount(initialize);

  $: if ($currentHymnalYear) {
    loadPopularHymns();
    if (searchQuery) {
      handleSearch();
    }
  }
</script>
