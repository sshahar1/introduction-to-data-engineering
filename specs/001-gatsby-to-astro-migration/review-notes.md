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

## Deploy preview (T025, T029) — PR #131, 2026-10-26

The first preview build failed at install: `astro@7.4.2` requires Node ≥ 22.23.4 and `.tool-versions` pinned 22.23.2. Fixed by pinning 22.23.4 (`.tool-versions`, `netlify.toml` `NODE_VERSION`, `package.json` engines). Second build passed, with no Netlify dashboard changes.

| Request | Result |
|---|---|
| `/` | 302 → `/1` |
| `/1`, `/12`, `/40` | 200 |
| `/12/` | 301 → `/12`, so shared trailing-slash links (production served `/12/`) keep working; no extra rule needed |
| `/41`, `/999` | 404 (NOT FOUND page) |
| `/sw.js` | 200, `Cache-Control: no-cache` |
| `/_astro/*` | `Cache-Control: public,max-age=31536000,immutable` |

Headers on `/1`, `/999` and `/` match the production baseline exactly: CSP (12 directives), Permissions-Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `X-XSS-Protection: 1; mode=block`.

## Visual review (T014) — to be filled in by the maintainer

40 slides × desktop (1920×1080) and mobile (375×812), compared side by side with production. Record any noticed difference here with its resolution.

| Slide | Size | Difference | Resolution |
|---|---|---|---|
| deck-wide | desktop + mobile | Maintainer review (2026-10-26, `yarn serve` vs production): the deck "looks a little better than in Gatsby"; no regressions reported | Accepted as an improvement (A5) |

**A5 (accepted)**: overall rendering judged slightly better than production; no specific slide flagged. The likely source is the optimised responsive images (A1) and the simpler page markup.

## Worker retirement, local (T041)

Automated with headless Brave over the DevTools protocol, both builds on one origin (`http://localhost:8000`), fresh profile, 2026-10-26:

| Step | Registrations | Controlled | Caches | Page |
|---|---|---|---|---|
| Gatsby `master` build, after visiting `/1/` and `/5/` | 1 | yes | 2 | Gatsby |
| Astro build, first load of `/1` | **0** | no | **0** | Astro (40 slides) |
| *Control: Astro build without `sw.js`, loads 1–3* | 1 | yes | 2 | Astro |

**Result**: PASS after one load. The control shows that without the kill switch the old worker stays registered and keeps its caches, so `public/sw.js` is what retires it. SC-006 still gets a production re-check after merge (T038).

## Navigation check (T018)

Keys and swipes tried on the local build (2026-10-26); maintainer confirmed with no issues reported.
