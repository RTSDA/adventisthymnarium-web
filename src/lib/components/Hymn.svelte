<script lang="ts">
  interface Hymn {
    number: number;
    title: string;
    lyrics: string[];
    category?: string;
    author?: string;
    composer?: string;
    year?: number;
  }

  export let hymn: Hymn;
</script>

<article class="hymn">
  <header>
    <h2>{hymn.number}. {hymn.title}</h2>
    {#if hymn.author || hymn.composer}
      <div class="metadata">
        {#if hymn.author}<p>Words: {hymn.author}</p>{/if}
        {#if hymn.composer}<p>Music: {hymn.composer}</p>{/if}
        {#if hymn.year}<p>Year: {hymn.year}</p>{/if}
      </div>
    {/if}
  </header>

  <div class="lyrics">
    {#each hymn.lyrics as verse, i}
      <p class="verse">
        <span class="verse-number">{i + 1}</span>
        {verse}
      </p>
    {/each}
  </div>
</article>

<style>
  .hymn {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .metadata {
    font-size: 0.9rem;
    color: #666;
  }

  .verse {
    margin-bottom: 1rem;
    position: relative;
    padding-left: 2rem;
  }

  .verse-number {
    position: absolute;
    left: 0;
    font-weight: bold;
  }
</style> 