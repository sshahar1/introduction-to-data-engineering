# Data Model: Gatsby → Astro Migration

The deck has no runtime data store. The "data" is the build-time slide collection made from Markdown files. This file defines the entities from [spec.md § Key Entities](spec.md#key-entities) as they exist in the new build.

## SlideFile (input, on disk)

| Field | Source | Rules |
|---|---|---|
| `path` | `src/slides/<name>.md` | Must match `NN-topic[suffix].md` (constitution §II). Plain string sort of `path` defines order. |
| `frontmatter.title` | YAML frontmatter | Required in practice (all 40 files have it). Not shown on screen. Kept as metadata. |
| `body` | Markdown after frontmatter | Split into 1..n chunks at thematic-break lines that follow a blank line and sit outside fenced code ([research R2](research.md#r2-slide-pipeline-split-markdown-source-render-each-chunk)). |
| linked assets | relative `![alt](file)` refs | Resolved against the file's own directory. Must exist at build time, or the build fails. |

## Slide (collection entry `slides`)

| Field | Type | Rules |
|---|---|---|
| `id` | string | `String(index)`. Unique. |
| `data.index` | integer ≥ 1 | Consecutive across the whole deck, in SlideFile order, then chunk order. No gaps. |
| `data.title` | string | Copied from the parent SlideFile's `frontmatter.title`. |
| `data.source` | string | Repo-relative path of the parent SlideFile (for debugging and review). |
| `rendered` | RenderedContent | Output of `renderMarkdown(chunk, { fileURL })`. Rendered on the page through `render()` / `<Content />`. |

**Derived**
- `total` = number of Slide entries. With today's content it is 40.
- URL = `/<index>` ([contracts/routes.md](contracts/routes.md)).

**Validation (build fails if broken)**
- Zero Slide entries → error ("no slides found in src/slides").
- An empty chunk (two separators in a row) is kept as a blank slide, matching Gatsby's `split('<hr>')`, so numbering never shifts. Today it never occurs.

## SiteMetadata (constant)

Defined once in `src/site.js`, replacing `gatsby-config.js` `siteMetadata`.

| Field | Value |
|---|---|
| `name` | `Sigal Shaharabani` |
| `title` | `Tikal Knowledge ™ 2020` |
| `date` | `April 8, 2020` (kept for parity, not rendered today) |

Document title = `${title} — ${name}`.

## Asset

| Kind | Location | Handling |
|---|---|---|
| Slide images | `src/resources/*.{JPG,jpg,png}`, referenced from slides as `../resources/<file>` | Optimised by `astro:assets`, `srcset` up to the source width (≤ 1920). |
| Logo | `src/resources/logo.png` | Imported in the layout and emitted under `/_astro/`. |
| Fonts | `src/resources/fonts/*.woff2` | Referenced from `src/layouts/index.css` with unchanged relative URLs, emitted under `/_astro/`. |
| Static passthrough | `public/` (`_headers`, `_redirects`, `sw.js`) | Copied to `dist/` unchanged. |

## State transitions (client)

Current slide `n` (read from `#slide[data-index]`), total `N`:

| Input | Condition | Result |
|---|---|---|
| ArrowRight / Enter / Space / swipe-left | `n < N` | navigate to `/n+1` |
| same | `n = N` | no-op |
| ArrowLeft / swipe-right | `n > 1` | navigate to `/n-1` |
| same | `n = 1` | no-op |
| any | no `#slide[data-index]` (404 page) | no-op |
