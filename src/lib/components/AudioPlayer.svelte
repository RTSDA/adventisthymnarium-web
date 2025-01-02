<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { spring } from 'svelte/motion';

  export let src: string;
  export let title: string;

  let audio: HTMLAudioElement;
  let progressBar: HTMLDivElement;
  let isPlaying = false;
  let duration = 0;
  let currentTime = 0;
  let volume = 1;
  let isMuted = false;
  let isLoading = false;
  let hasError = false;
  let isDragging = false;
  let wasPlayingBeforeDrag = false;

  const progress = spring(0, {
    stiffness: 0.2,
    damping: 0.4
  });

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function handlePlayPause() {
    if (!audio) return;
    
    try {
      if (audio.paused) {
        isLoading = true;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error('Playback error:', error);
      hasError = true;
    } finally {
      isLoading = false;
    }
  }

  function handleVolumeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    volume = parseFloat(input.value);
    audio.volume = volume;
    if (volume === 0) {
      isMuted = true;
    } else {
      isMuted = false;
    }
  }

  function handleMute() {
    if (isMuted) {
      audio.volume = volume;
    } else {
      audio.volume = 0;
    }
    isMuted = !isMuted;
  }

  function handleProgressClick(e: MouseEvent) {
    if (!duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * duration;
  }

  function handleProgressDragStart(e: MouseEvent) {
    isDragging = true;
    wasPlayingBeforeDrag = isPlaying;
    if (isPlaying) {
      audio.pause();
    }
    handleProgressDrag(e);
  }

  function handleProgressDrag(e: MouseEvent) {
    if (!isDragging) return;
    
    const rect = progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progress.set(pos * 100);
  }

  function handleProgressDragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    audio.currentTime = (progress.get() / 100) * duration;
    if (wasPlayingBeforeDrag) {
      audio.play();
      isPlaying = true;
    }
  }

  onMount(() => {
    window.addEventListener('mousemove', handleProgressDrag);
    window.addEventListener('mouseup', handleProgressDragEnd);

    if (audio && src) {
      audio.load();
    }

    return () => {
      window.removeEventListener('mousemove', handleProgressDrag);
      window.removeEventListener('mouseup', handleProgressDragEnd);
    };
  });

  onDestroy(() => {
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
  });
</script>

<div class="audio-player">
  <div class="player-header">
    <div class="title">{title}</div>
    {#if isLoading}
      <div class="loading-indicator">
        <div class="spinner"></div>
        Loading...
      </div>
    {/if}
  </div>

  <div class="controls-container">
    <button 
      class="play-button" 
      on:click={handlePlayPause}
      disabled={isLoading || hasError}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>

    <div class="time-and-progress">
      <div class="time">{formatTime(currentTime)}</div>
      <div 
        class="progress-bar" 
        bind:this={progressBar}
        on:mousedown={handleProgressDragStart}
        on:click={handleProgressClick}
      >
        <div class="progress-background"></div>
        <div 
          class="progress-fill"
          style="width: {$progress}%"
        ></div>
        <div 
          class="progress-handle"
          style="left: {$progress}%"
        ></div>
      </div>
      <div class="time">{formatTime(duration)}</div>
    </div>

    <div class="volume-controls">
      <button 
        class="mute-button"
        on:click={handleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {#if isMuted || volume === 0}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        {:else if volume < 0.5}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M7 9v6h4l5 5V4l-5 5H7z"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        {/if}
      </button>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01"
        bind:value={volume}
        on:input={handleVolumeChange}
        class="volume-slider"
        aria-label="Volume"
      />
    </div>
  </div>

  <audio
    bind:this={audio}
    {src}
    on:play={() => {
      isPlaying = true;
      isLoading = false;
    }}
    on:pause={() => {
      isPlaying = false;
      isLoading = false;
    }}
    on:timeupdate={() => {
      if (!isDragging) {
        currentTime = audio.currentTime;
        progress.set((currentTime / duration) * 100);
      }
    }}
    on:loadedmetadata={() => {
      duration = audio.duration;
      isLoading = false;
    }}
    on:waiting={() => isLoading = true}
    on:canplay={() => isLoading = false}
    on:error={() => {
      hasError = true;
      isLoading = false;
    }}
    preload="none"
    playsinline
    webkit-playsinline
  />
</div>

<style>
  .audio-player {
    width: 100%;
    max-width: 600px;
    padding: 1rem;
  }

  .player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .title {
    font-weight: 500;
    color: #333;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .controls-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .play-button {
    background: none;
    border: none;
    color: #2196f3;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .play-button:hover {
    background: rgba(33, 150, 243, 0.1);
  }

  .play-button:disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  .time-and-progress {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .time {
    font-size: 0.9rem;
    color: #666;
    font-variant-numeric: tabular-nums;
    min-width: 45px;
  }

  .progress-bar {
    flex: 1;
    height: 36px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  .progress-background {
    position: absolute;
    left: 8px;
    right: 8px;
    height: 4px;
    background: #eee;
    border-radius: 2px;
  }

  .progress-fill {
    position: absolute;
    left: 8px;
    height: 4px;
    background: #2196f3;
    border-radius: 2px;
    transition: width 0.1s linear;
  }

  .progress-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #2196f3;
    border-radius: 50%;
    transform: translateX(-50%);
    transition: transform 0.1s ease;
  }

  .progress-handle:hover {
    transform: translateX(-50%) scale(1.2);
  }

  .volume-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mute-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .mute-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .volume-slider {
    width: 80px;
    height: 4px;
    -webkit-appearance: none;
    background: #eee;
    border-radius: 2px;
    outline: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #666;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  @media (max-width: 600px) {
    .audio-player {
      padding: 0.75rem;
    }

    .volume-controls {
      display: none;
    }

    .time {
      font-size: 0.8rem;
      min-width: 40px;
    }

    .progress-bar {
      height: 32px;
    }
  }
</style> 