<script lang="ts">
  export let url: string;
  export let title: string;
</script>

<div class="viewer-container">
  <object
    data={url}
    type="image/png"
    class="sheet-music-viewer"
    title={title}
  >
    <div class="fallback">
      <a href={url} target="_blank" rel="noopener noreferrer">
        Open sheet music in new tab
      </a>
    </div>
  </object>
</div>

<style>
  .viewer-container {
    width: 100%;
    min-height: 800px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .sheet-music-viewer {
    width: 100%;
    height: 800px;
    border: none;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .fallback {
    padding: 2rem;
    text-align: center;
  }

  .fallback a {
    color: #2196f3;
    text-decoration: none;
  }

  .fallback a:hover {
    text-decoration: underline;
  }
</style> 