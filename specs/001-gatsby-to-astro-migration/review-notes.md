# Review Notes: Gatsby → Astro Parity

Running record of differences between the production Gatsby deck and the Astro build (FR-014, SC-001). Copy the "Accepted" items into the PR description.

## Automated checks (2026-10-26)

| Check | Result |
|---|---|
| Slide text, `/1`–`/40`, production vs `dist/` (tags stripped, whitespace normalised) | 40/40 identical |
| Page title | `Tikal Knowledge ™ 2020 — Sigal Shaharabani` on every page |
| External requests in build output | none; fonts served from `/_astro/*.woff2` |
| Slide splitting (temporary file, T023) | setext `---` → `<h2>`, `***` splits, fenced `---` stays code |

## Differences found and fixed

| # | Difference | Fix |
|---|---|---|
| 1 | Astro converted `'` to `’` (smart punctuation) on 3 slides (25, 30, 32) | `markdown.smartypants: false` |
| 2 | Astro syntax-highlights code blocks with inline theme colours; Gatsby emitted plain `<pre><code>` | `markdown.syntaxHighlight: false` |
| 3 | Optimised images carry `width`/`height` attributes; with the `max-height: 500px` cap they would distort | `.slide-content img { width: auto; height: auto; }` in `index.css` |

## Differences accepted (not visible to viewers)

| # | Difference | Why accepted |
|---|---|---|
| A1 | Images are WebP with a responsive `srcset` and `loading="lazy"` (production: original JPG/PNG) | FR-012 asks for optimised, responsive images; same display size |
| A2 | Headings get `id` attributes (e.g. `<h1 id="who-am-i">`) | Invisible; no styles target them |
| A3 | 404 page footer shows no slide number, and keys don't navigate there (Gatsby showed "1") | Planned (plan.md § Accepted differences) |
| A4 | Root `/` is a server-side 302 to `/1` (production: client-side JS redirect) | Required by FR-006 |

## Open: URL shape (check on deploy preview, T025)

Production currently answers `/12` with **301 → `/12/`**, so links shared from the live site likely use the trailing slash. The Astro build serves `/12`; under `astro preview`, `/12/` is 404. The spec requires `/12/` to reach slide 12 or redirect to `/12`. Confirm on the Netlify deploy preview, and add a redirect rule if needed.

## Visual review (T014) — to be filled in by the maintainer

40 slides × desktop (1920×1080) and mobile (375×812), compared side by side with production. Record any noticed difference here with its resolution.

| Slide | Size | Difference | Resolution |
|---|---|---|---|
| | | | |
