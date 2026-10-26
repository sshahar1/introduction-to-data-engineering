# Introduction to Data Engineering - Claude Code Guide

## Development Commands

### Common Development Tasks
- **Start development server**: `yarn develop` (runs `astro dev --port 8000`)
- **Build for production**: `yarn build` (runs `astro build`, output in `dist/`)
- **Preview production build**: `yarn serve` (runs `astro preview --port 8000`)
- **Clean cache and output**: `yarn clean` (removes `dist/`, `.astro/`, `node_modules/.astro`)
- **Format code**: `yarn format` (runs `prettier --write "src/**/*.{js,astro}" "*.mjs"`)
- **Install husky hooks**: `yarn prepare` (runs `husky`)

### Development Workflow
1. Start development: `yarn develop`
2. Make changes to source files in `src/` (slide files reload live)
3. Code is automatically formatted on commit via husky pre-commit hook
4. Build for production: `yarn build`
5. Preview production build: `yarn serve` (after building)

## Project Structure

### Key Directories
- `src/slides/` - Markdown slides, loaded by the custom loader in `src/content.config.js`
- `src/layouts/` - `Deck.astro` (page shell, footer, transitions) and `index.css` (all styles)
- `src/pages/` - `[slide].astro` (generates `/1` ... `/N`) and `404.astro`
- `src/scripts/` - Client scripts (`navigation.js`: keyboard and swipe navigation)
- `src/resources/` - Images, logo and self-hosted fonts
- `public/` - Files copied to `dist/` unchanged (`_headers`, `_redirects`, `sw.js`)

### Key Configuration Files
- `astro.config.mjs` - URL format (no trailing slash), image settings, Markdown options, redirects
- `netlify.toml` - Netlify build command and publish directory
- `public/_headers` - Security headers (CSP, Permissions-Policy, etc.) and cache rules
- `src/content.config.js` - Slide collection: sorts files, splits slides, renders Markdown
- `src/site.js` - Site metadata (title, presenter name)
- `package.json` - Dependencies and scripts
- `.husky/pre-commit` - Pre-commit hook running prettier

### Key Dependencies
- **astro**: ^7.4.2 (static site generator; includes Markdown, image optimisation via sharp, and view transitions)
- **prettier**: ^3.3.3 with **prettier-plugin-astro**: ^1.1.2 (code formatting)
- **husky**: ^9.1.6 (git hooks)
- **eslint**: ^9.26.0 and **typescript**: ^4.0.0 (installed but not configured or run)

## Development Guidelines

### Code Formatting
- JavaScript and `.astro` files are automatically formatted on commit via husky + prettier
- Manual formatting: `yarn format`
- ESLint 9 is installed but not configured (no `eslint.config.*`), and it does not run on commit

### Slide Creation
- Slides are Markdown files in `src/slides/`, ordered by file name (`NN-topic[suffix].md`)
- Separate slides within a file with a `---` line preceded by a blank line (a `---` directly under text is a heading)
- Prefer plain Markdown; use inline HTML only when Markdown cannot express the content (constitution §I)
- Markdown output keeps punctuation as written (no smart quotes) and code blocks unhighlighted

### Component and Script Usage
- The deck has no client-side UI framework; navigation is plain JavaScript in `src/scripts/`
- Slide transitions use Astro's `ClientRouter` with a 200ms fade on `#slide`
- Reusable components, if ever needed, go in `src/components/` (constitution §V)

### Image Handling
- Put images in `src/resources/` and reference them from slides as `../resources/<file>`
- Images are optimised at build time (WebP, responsive `srcset`), capped at 1920px wide
- `.slide-content img` keeps natural aspect ratio under the `max-height: 500px` cap

### Deployment
- Netlify, static hosting, configured by the committed `netlify.toml`
- Build command: `yarn build`
- Publish directory: `dist/`
- `/` redirects to `/1` via `public/_redirects`
- No service worker is registered; `public/sw.js` only retires the old Gatsby worker

## Troubleshooting

### Common Issues
1. **Image not found at build**: Check the relative path from the slide file (`../resources/<file>`)
2. **Build failures**: Run `yarn clean` then `yarn build` to clear cache
3. **Formatting issues**: Run `yarn format`
4. **Dependency issues**: Delete `node_modules`, then run `yarn install` (`yarn.lock` is the only lockfile — never commit a `package-lock.json`)
5. **Port 8000 busy**: `astro dev` picks the next free port; stop old servers with `npx astro dev stop`

### Development Server
- Default URL: http://localhost:8000
- Hot reloading is enabled during development

## Slide Navigation
- Right Arrow, Enter or Space: next slide; Left Arrow: previous slide
- Swipe left/right on touch devices
- Navigation stops at the first and last slide
- Slide transitions are a 200ms opacity fade
