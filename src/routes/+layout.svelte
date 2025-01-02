<script lang="ts">
  import { page } from '$app/stores';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let isMenuOpen = false;
  let lastScrollY = 0;
  let isHeaderVisible = true;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    isHeaderVisible = currentScrollY <= lastScrollY || currentScrollY < 50;
    lastScrollY = currentScrollY;
  }
</script>

<svelte:window on:scroll={handleScroll} />

<div class="app-container">
  <header class:hidden={!isHeaderVisible}>
    <div class="header-content">
      <a href="/" class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <span>Adventist Hymnarium</span>
      </a>

      <nav class="desktop-nav">
        <a 
          href="/" 
          class:active={$page.url.pathname === '/'}
        >
          Home
        </a>
        <a 
          href="/hymns" 
          class:active={$page.url.pathname.startsWith('/hymns')}
        >
          Hymns
        </a>
        <a 
          href="/about" 
          class:active={$page.url.pathname === '/about'}
        >
          About
        </a>
      </nav>

      <button class="menu-button" on:click={toggleMenu} aria-label="Toggle menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    </div>
  </header>

  {#if isMenuOpen}
    <div 
      class="mobile-nav-overlay"
      on:click={toggleMenu}
      transition:fade={{ duration: 200 }}
    >
      <nav 
        class="mobile-nav"
        transition:fly={{ x: 300, duration: 300, easing: quintOut }}
        on:click|stopPropagation
      >
        <div class="mobile-nav-header">
          <span class="logo-text">Menu</span>
          <button class="close-button" on:click={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <a 
          href="/" 
          class:active={$page.url.pathname === '/'}
          on:click={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          Home
        </a>
        <a 
          href="/hymns" 
          class:active={$page.url.pathname.startsWith('/hymns')}
          on:click={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          Hymns
        </a>
        <a 
          href="/about" 
          class:active={$page.url.pathname === '/about'}
          on:click={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          About
        </a>
      </nav>
    </div>
  {/if}

  <main>
    <slot />
  </main>

  <footer>
    <div class="footer-content">
      <p>© {new Date().getFullYear()} Adventist Hymnarium</p>
      <p>All hymnal content is owned by and used with permission from the General Conference Corporation of Seventh-day Adventists®</p>
    </div>
  </footer>
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
    transition: transform 0.3s ease;
  }

  header.hidden {
    transform: translateY(-100%);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #2196f3;
    font-weight: 500;
    font-size: 1.2rem;
  }

  .desktop-nav {
    display: flex;
    gap: 1rem;
  }

  .desktop-nav a {
    text-decoration: none;
    color: #666;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    position: relative;
  }

  .desktop-nav a:hover {
    color: #2196f3;
    background: rgba(33, 150, 243, 0.1);
  }

  .desktop-nav a.active {
    color: #2196f3;
    background: rgba(33, 150, 243, 0.1);
  }

  .desktop-nav a.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 1rem;
    right: 1rem;
    height: 2px;
    background: #2196f3;
    border-radius: 1px;
  }

  .menu-button {
    display: none;
    background: none;
    border: none;
    color: #666;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .menu-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .mobile-nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
    display: none;
  }

  .mobile-nav {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 300px;
    background: white;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mobile-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .logo-text {
    font-weight: 500;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    color: #666;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .mobile-nav a {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: #666;
    padding: 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .mobile-nav a:hover {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }

  .mobile-nav a.active {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }

  main {
    flex: 1;
    margin-top: 64px;
    background: #f8f9fa;
    padding-top: 2rem;
  }

  footer {
    background: white;
    border-top: 1px solid #eee;
    padding: 2rem 1rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .desktop-nav {
      display: none;
    }

    .menu-button {
      display: block;
    }

    .mobile-nav-overlay {
      display: block;
    }

    main {
      margin-top: 56px;
      padding-top: 1.5rem;
    }
  }
</style> 