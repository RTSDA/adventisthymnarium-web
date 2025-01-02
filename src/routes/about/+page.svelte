<script lang="ts">
  import { hymnStore } from '$lib/stores/hymns';
</script>

<div class="about">
  <h1>About Adventist Hymnarium</h1>
  
  <section class="content">
    <p>
      Welcome to the Adventist Hymnarium, a digital interface for accessing beloved hymns that have been sung
      in Seventh-day Adventist churches around the world. This web application aims to make these
      timeless songs of praise and worship accessible to everyone while respecting copyright and licensing requirements.
    </p>

    <h2>Our Collection</h2>
    <p>
      The Adventist Hymnarium provides a digital interface to access hymns from the Seventh-day Adventist Hymnal (1985)
      and Christ in Song (1908). All hymnal content, including lyrics, music, and arrangements, remains the intellectual
      property of their respective copyright holders. The Seventh-day Adventist Hymnal content is owned by and used with
      permission from the General Conference Corporation of Seventh-day Adventists®.
    </p>

    <h2>Features</h2>
    <ul>
      <li>Easy search and navigation of hymns</li>
      <li>Categorized hymn browsing</li>
      <li>Complete lyrics with verse numbers</li>
      <li>Historical information about hymns</li>
      <li>Author and composer details</li>
      <li>Sheet music and audio recordings (where available)</li>
      <li>Mobile-friendly design</li>
    </ul>

    <h2>Copyright Notice</h2>
    <p>
      The Adventist Hymnarium is solely a digital interface and does not claim ownership of any hymnal content.
      All hymns, including lyrics, music, and arrangements, are either copyrighted by their respective owners
      or are in the public domain. The Seventh-day Adventist Hymnal content is owned by and used with
      permission from the General Conference Corporation of Seventh-day Adventists®.
    </p>
    <p>
      Sheet music and recordings are provided for personal, non-commercial use only. Any other use,
      including but not limited to public performance, broadcasting, or commercial purposes, requires
      additional permissions from the copyright holders. The Adventist Hymnarium does not grant any
      rights or licenses to the copyrighted content it displays.
    </p>

    <h2>Contributing</h2>
    <p>
      This is an open-source project, and we welcome contributions to improve the digital interface. Whether
      it's enhancing the application's features, improving translations, or fixing technical issues,
      your help is valuable in making this resource better for everyone. All contributions must
      respect copyright laws and licensing requirements.
    </p>

    <h2>Contact</h2>
    <p>
      For questions, suggestions, contributions, or copyright-related inquiries, please reach out through our
      GitHub repository or contact form. For specific copyright permissions or concerns, please include
      detailed information about the hymn in question and contact the appropriate copyright holders directly.
    </p>

    <footer class="copyright">
      <p>© {new Date().getFullYear()} Adventist Hymnarium. All rights reserved.</p>
      <p class="disclaimer">
        This application is not officially affiliated with or endorsed by the General Conference of
        Seventh-day Adventists®. Seventh-day Adventist®, SDA®, and The Seventh-day Adventist Hymnal®
        are registered trademarks of the General Conference Corporation of Seventh-day Adventists®.
      </p>
    </footer>
  </section>
</div>

<style>
  .about {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
    color: #2c3e50;
  }

  .content {
    line-height: 1.6;
  }

  h2 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    color: #2c3e50;
  }

  p {
    margin-bottom: 1rem;
    color: #444;
  }

  ul {
    list-style-type: disc;
    margin-left: 2rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
    color: #444;
  }

  .copyright {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #eee;
    font-size: 0.9rem;
    color: #666;
  }

  .disclaimer {
    font-size: 0.8rem;
    font-style: italic;
    margin-top: 1rem;
  }
</style> 