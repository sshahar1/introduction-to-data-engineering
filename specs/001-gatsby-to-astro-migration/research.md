# Research: Gatsby → Astro Migration

**Feature**: [spec.md](spec.md) · **Date**: 2026-10-26
**Sources**: Astro docs via Context7 (`/withastro/docs`, `/withastro/astro` v6.3.1 snapshot), npm registry (2026-10-26: `astro@7.4.2`, `prettier-plugin-astro@1.1.2`), the current repository code.

Every Technical Context unknown is resolved below. Items marked **Verify** depend on platform behaviour that docs don't pin down. They are checked on the Netlify deploy preview (see [quickstart.md](quickstart.md)).

## R1. Astro version and toolchain

- **Decision**: `astro@^7.4.2`, static output (the default). Node 22 / Yarn 1 stay as in `.tool-versions`.
- **Rationale**: Latest stable. Static output needs no adapter, and Netlify serves `dist/` directly.
- **Alternatives**: Astro 6.x, the newest version with indexed docs. Rejected in favour of the current major. APIs used here (content loaders, `renderMarkdown`, `ClientRouter`, `fade`) exist since v5 and are unchanged in v6 docs. **Verify**: `yarn build` passes on 7.x. If a 7.x API changed, fix it in the plan before implementing.

## R2. Slide pipeline: split Markdown source, render each chunk

- **Decision**: A custom inline content loader in `src/content.config.js`:
  1. Read `src/slides/*.md`, sorted by path as plain strings (same as `gatsby-node.js`).
  2. Set aside the frontmatter. Split the body into chunks at thematic-break lines (`---`, `***`, `___`). A break only counts when it follows a blank line (or starts the body) and sits outside a fenced code block, so setext `---` headings never split.
  3. Render each chunk with `renderMarkdown(chunk, { fileURL })`, where `fileURL` is the source file, so relative images (`me.JPG`) resolve and get optimised.
  4. Store one entry per slide: id is the 1-based number; data holds `{ index, title, source }`.
- **Rationale**: Gatsby splits remark's HTML on `<hr>`. Astro's rendered HTML carries image placeholders that are only resolved through `render()`/`<Content />`. Splitting the HTML string would rely on that internal format. Splitting the source gives the same slides for every pattern remark turns into `<hr>`, and keeps image optimisation intact.
- **Alternatives**:
  - `import.meta.glob` + `compiledContent()`, then split the HTML: rejected, because local images in `compiledContent()` aren't run through `astro:assets` reliably.
  - Standard `glob()` loader with one entry per file: rejected, because it can't produce multiple slides per file.
  - Rendering the whole file once and splitting `rendered.html` with shared `metadata.imagePaths`: rejected, because it depends on undocumented internals.
- **Current content**: 40 files, no body separators, no code fences, 3 images. The loader's split path is exercised by the quickstart's temporary-file check (spec User Story 4, scenario 2).

## R3. Routing and URLs

- **Decision**:
  - `trailingSlash: 'never'` with `build.format: 'file'` → `dist/1.html` … `dist/40.html`, served by Netlify at `/1` … `/40`.
  - Page `src/pages/[slide].astro` with `getStaticPaths()` built from the collection.
  - `/` → `/1`: `public/_redirects` rule `/  /1  302!` (server-side, so it adds no history entry). Astro `redirects: { '/': '/1' }` gives the same behaviour on the dev server.
  - `src/pages/404.astro` → `dist/404.html`, which Netlify serves automatically.
- **Rationale**: Astro's docs pair `file` with `trailingSlash: 'never'` for consistent dev/build URLs. The forced (`!`) redirect wins over the meta-refresh `index.html` that Astro's `redirects` emits.
- **Alternatives**: `build.format: 'directory'` (Netlify tends to redirect `/12` → `/12/`, breaking FR-005); the `@astrojs/netlify` adapter to translate `redirects` (an extra dependency for one rule).
- **Verify**: `/12/` reaches slide 12, or redirects to `/12` (spec edge case). If Netlify 404s it, add a `_redirects` rule for `/:n/` → `/:n`, and confirm it doesn't loop.

## R4. Transitions and navigation

- **Decision**:
  - Use `<ClientRouter />` in the layout's `<head>`.
  - Put `transition:animate="none"` on `<html>` so the page itself doesn't animate by default, `transition:animate={fade({ duration: '0.2s' })}` on the `#slide` wrapper, and `transition:animate="none"` on `<footer>`. The slide cross-fades in 200 ms while the footer number swaps instantly, matching Gatsby (whose footer sits outside the `<Transition>`).
  - Navigation is one bundled module, `src/scripts/navigation.js`:
    - **Keys**: a single `keydown` listener on `document`, using `event.key` (`ArrowRight`, `Enter`, ` ` → next; `ArrowLeft` → previous). Like the original, it doesn't call `preventDefault`.
    - **Swipe**: a `touchstart`/`touchend` pair on `document`. A swipe counts when the horizontal distance is at least 10 px and larger than the vertical distance (`react-swipeable`'s default `delta` is 10).
    - **Current slide and total**: read from `data-index` and `data-total` on `#slide` *at event time*, so navigation stays correct after client-side page swaps.
    - **Moving**: `navigate()` from `astro:transitions/client`.
- **Rationale**: Bundled module scripts run once, even across `ClientRouter` navigations, so there are no duplicate listeners. Reading the DOM at event time replaces the React state and closure. `ClientRouter` falls back to a simulated animation in browsers without the View Transitions API.
- **Alternatives**:
  - CSS-only page fade with no client router: rejected, because each navigation becomes a full page load, giving a white flash and no cross-fade.
  - Keeping React islands: rejected under constitution §V.
- **Rapid presses**: bounds are checked against the DOM index. A press during a transition can at worst re-request the same next slide, never go past the last one.

## R5. Images

- **Decision**: Use Astro's built-in `astro:assets` (sharp) through Markdown. Set `image.layout: 'constrained'` globally, with `image.breakpoints` capped at 1920 (constitution §IV), for `srcset` up to the source width (1072, 632 and 641 px today, all under 1920). Keep `image.responsiveStyles` off, so the existing `img { max-height: 500px }` rule still controls size.
- **Rationale**: Covers FR-012 (optimised, responsive, ≤ 1920 px) with no extra dependency. Images live in `src/resources/` (moved by T040, constitution §IV) and are referenced as `../resources/<file>`; `renderMarkdown`'s `fileURL` resolves these relative paths.
- **Alternatives**: Moving images to `public/`: rejected, because they would not be optimised.
- **Watch**: `gatsby-remark-images` wraps each image in `span.gatsby-resp-image-wrapper` (block, centred, `max-width` = image width) with a blur-up background. The plain `<img>` may centre and size differently. If the side-by-side review shows a difference, add a scoped rule to `index.css`, for example `.slide-content img { display: block; margin: 0 auto; }`.

## R6. Security headers on Netlify

- **Decision**: `public/_headers`, applied to `/*`:
  - The existing CSP (all 12 directives unchanged) and Permissions-Policy.
  - Gatsby's default security headers, re-added explicitly so they aren't lost: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`.
  - `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`.
  - `/sw.js` → `Cache-Control: no-cache`.
- **Rationale**: Netlify reads `_headers` from the publish dir, so no adapter is needed. Keeping `'unsafe-inline'` for `script-src` and `style-src` keeps the policy no looser than today's. `ClientRouter` injects inline styles while animating.
- **Alternatives**: Headers in `netlify.toml` (works the same, but keeping them in `_headers` puts them next to the output). Removing `'unsafe-inline'` from `script-src` is a possible hardening step, deferred: it isn't required by FR-018 and needs a per-page audit.
- **Verify**: `curl -sI` on the deploy preview shows every header (SC-005).

## R7. Retiring the Gatsby service worker

- **Decision**: Ship `public/sw.js`, at the same path and scope `gatsby-plugin-offline` registered. It is a "kill switch" worker:
  - `install` → `self.skipWaiting()`.
  - `activate` → delete every `caches` key, `self.registration.unregister()`, then `client.navigate(client.url)` for every window client.
  - The new site contains **no** `navigator.serviceWorker.register` call.
- **Rationale**: On navigation, the browser checks the registered worker script for updates, bypassing the HTTP cache for the top-level script by default. The changed `sw.js` installs, wipes the Gatsby precache, unregisters itself and reloads the tab onto the new deck. That's SC-006 (first or second load). Fresh visitors never register anything (FR-020).
- **Alternatives**: Deleting `sw.js` (a 404 on the update check eventually unregisters, but the browser may keep serving the stale precache for some time); a `Clear-Site-Data` header (blunt, and clears more than needed).
- **Verify**: In a browser profile that visited production before the cutover, open the deploy preview and confirm no worker stays registered and the new deck shows.

## R8. Build, scripts and formatting

- **Decision**:

| Script | New command | Note |
|---|---|---|
| `develop` | `astro dev --port 8000` | Keeps the dev URL `http://localhost:8000` |
| `build` | `astro build` | Output in `dist/` |
| `clean` | `rm -rf dist .astro node_modules/.astro` | |
| `serve` | `astro preview --port 8000` | New; this is the venue fallback |
| `format` | `prettier --write "src/**/*.{js,astro}" "*.mjs"` | |

  - `.prettierrc`: drop the global `"parser": "babel"` (Prettier infers it from the file extension), add `"plugins": ["prettier-plugin-astro"]`, and add an `overrides` entry for `*.astro`.
  - `netlify.toml`: `[build] command = "yarn build"`, `publish = "dist"`. The committed file overrides the stale `public/` setting in the Netlify UI (FR-017).
  - `.gitignore`: **stop ignoring `public/`** (it becomes Astro's static-files source), and add `dist/` and `.astro/`.
- **Rationale**: Script names stay the same (FR-022). Fixing the dev port avoids doc churn. The husky hook already runs `npm run format`.
- **Alternatives**: Keeping `.cache/` in `.gitignore`: harmless, so it's simply removed along with the other Gatsby entries.

## R9. Dependencies

- **Decision**:
  - **Runtime**: `astro` only. `sharp` comes through Astro's dependency tree with Yarn 1 hoisting; add it explicitly only if the build reports it missing.
  - **Removed**: all 19 current runtime dependencies. This includes `@expo/devcert`, `cookie` and `tar-fs`, which only pinned vulnerable transitive Gatsby dependencies.
  - **Dev**: add `prettier-plugin-astro`. The existing dev dependencies stay; removing unused ESLint/TypeScript is out of scope.
- **Result**: 26 → 9 declared dependencies (−65%), which meets SC-004 (≥ 50%). Each addition is justified in the PR description (constitution §V).
- **Verify**: `yarn audit` after the change (team pre-commit checklist §9).

## R10. Governance updates (FR-024)

- **Decision**:
  - **Constitution v2.0.0 (MAJOR)**, done in Phase 0 (T030): §III build command plus a preview gate; §IV Gatsby references removed (the `src/resources/` location rule is kept, and the images were moved to comply, T040); Technology & Deployment Constraints (Astro stack, `dist/`, no service worker, plain-JS navigation); Workflow `yarn` scripts.
  - **New ADRs** through the Architect extension: ADR-007 "Astro static site generator" (supersedes ADR-001 and ADR-006), and ADR-008 "No offline worker; local-build venue fallback" (supersedes ADR-005).
  - **ADR-002 and ADR-003**: keep the decisions, add a note about the new mechanism.
  - Regenerate `AD.md`; update `CLAUDE.md` and `README.md` (including the venue fallback).
  - Memory follow-ups A2/E1 become moot. Re-run `/architect-analyze` after the merge.
- **Rationale**: These docs name Gatsby mechanisms, so leaving them would break SC-008.
