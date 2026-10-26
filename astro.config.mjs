import { defineConfig } from 'astro/config';

export default defineConfig({
  // Slides live at /1, /2, ... with no trailing slash (dist/1.html, ...)
  trailingSlash: 'never',
  build: { format: 'file' },
  // Dev-server parity; production uses the forced rule in public/_redirects
  redirects: { '/': '/1' },
  image: {
    layout: 'constrained',
    // Cap generated widths at 1920px (constitution §IV)
    breakpoints: [640, 750, 828, 1080, 1280, 1668, 1920],
  },
  // Keep punctuation as written, matching the previous Gatsby/remark output
  markdown: { smartypants: false },
  devToolbar: { enabled: false },
});
