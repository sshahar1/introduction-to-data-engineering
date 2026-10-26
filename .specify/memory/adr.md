# Architecture Decision Records

## ADR Index

| ID | Sub-System | Decision | Status | Date | Owner |
|----|------------|----------|--------|------|-------|
| ADR-001 | System | Slide Deck Built as a Static-Site-Generated Web App (Gatsby) | Superseded | 2026-10-26 | Legacy/Inferred |
| ADR-002 | System | Slide Content Model — Markdown Files Split on `<hr>`, Ordered by File Path | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-003 | System | In-House Presentation Runtime (Navigation, Transitions) | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-004 | System | Netlify Hosting with Platform-Side Builds, No Repository CI | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-005 | System | Offline-Capable PWA via Service Worker | Superseded | 2026-10-26 | Legacy/Inferred |
| ADR-006 | System | Evolution Strategy — Incremental Upgrades of an Aging Gatsby Starter | Superseded | 2026-10-26 | Legacy/Inferred |
| ADR-007 | System | Slide Deck Built with Astro as a Static Site | Accepted | 2026-10-26 | User/AI collaboration |
| ADR-008 | System | No Offline Service Worker; Local-Build Venue Fallback | Accepted | 2026-10-26 | User/AI collaboration |

---
---

## ADR-001: Slide Deck Built as a Static-Site-Generated Web App (Gatsby)

### Status
Superseded by ADR-007 (2026-10-26)

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
The "Introduction to Data Engineering" talk is delivered as a website rather than a
presentation-tool file. The repository is a single deployable static site with no backend,
database, or API.

**Evidence Found**:
- `package.json`: `gatsby` ^5.16.1, `react` ^18, keywords `gatsby-starter`; description
  "Introduction to data engineering presentation with Gatsby"
- `gatsby-config.js`: content sourced from `src/slides` via `gatsby-source-filesystem`
- `README.md`: "Presentation Deck Template"
- No server code, no data store, no API routes in `src/`

### Decision
Build and ship the presentation as a statically generated React/Gatsby site: one deployable
unit (monolith), all pages pre-rendered at build time, served as static files.

### Consequences

#### Positive (Observed)
- Deck is reachable by URL, shareable, and version-controlled as plain text
- No runtime infrastructure to operate; hosting reduces to static file serving
- Full control over look and behaviour through React/CSS

#### Negative (Potential)
- A full web framework (Gatsby, sharp, GraphQL layer) is heavy for ~45 Markdown files
- Framework upgrades (Gatsby majors, Node engine bumps) are recurring maintenance
- Slide features that presentation tools provide for free (speaker notes, overview, PDF
  export) are absent unless built

#### Risks
- Gatsby ecosystem momentum has slowed; long-term plugin support is uncertain (see ADR-006)

### Common Alternatives
#### Dedicated HTML slide framework (reveal.js, Slidev, Marp)
**Description**: Markdown-driven slide tools with built-in navigation, notes, and export.
**Trade-offs**: Less code to own and richer presenter features; less freedom over build
pipeline and styling.

#### Presentation software (PowerPoint, Google Slides, Keynote)
**Description**: Binary/hosted slide documents.
**Trade-offs**: Fast authoring and presenter tooling; weak diffing and no code-native workflow.

### Confidence Level
HIGH - Unambiguous from dependencies, config, and README. Why Gatsby was chosen over slide
frameworks is unknown (repo appears to originate from a Gatsby presentation starter).

---

## ADR-002: Slide Content Model — Markdown Files Split on `<hr>`, Ordered by File Path

### Status
Accepted

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
Slide content must be authored as text and turned into an ordered sequence of slide pages.

**Evidence Found**:
- `src/slides/`: ~45 files named `NN-topic[NN].md` (e.g. `11-persisting04.md`)
- `gatsby-node.js` `createPages`: queries all `MarkdownRemark` nodes, sorts by
  `fileAbsolutePath` string comparison, splits each node's rendered `html` on the literal
  string `'<hr>'`, creates a custom `Slide` node per fragment
- One page per slide at `/${index}` (1-based, global across all files); `src/pages/index.js`
  redirects `/` → `/1`
- `onCreatePage` strips trailing slashes from paths

### Decision
Each Markdown file holds one or more slides separated by `---`. Presentation order is the
lexicographic order of absolute file paths. Slides are numbered globally and each becomes a
static page addressed by its position number.

### Consequences

#### Positive (Observed)
- Authoring is plain Markdown; reordering is a file rename
- Simple, dependency-free ordering mechanism

#### Negative (Potential)
- Splitting on rendered HTML string `<hr>` is brittle: a remark/rehype change emitting
  `<hr/>` or attributes would silently stop splitting; a literal `<hr>` in content would split
- Slide URLs are positional: inserting one slide renumbers every later URL, breaking shared
  links and bookmarks
- Sort uses absolute path, so ordering depends on naming discipline only
  (`11-persisting.md` sorts before `11-persisting04.md` — works today by convention)

#### Risks
- Silent mis-splitting would not fail the build; only visual review catches it

### Common Alternatives
#### Frontmatter-ordered slides (`order:` field) with stable slugs
**Description**: Explicit order and per-slide slug in frontmatter.
**Trade-offs**: Stable URLs and explicit ordering; more metadata to maintain per file.

#### Split at Markdown AST level (thematicBreak nodes)
**Description**: Split before HTML rendering using remark AST.
**Trade-offs**: Robust to HTML serialisation changes; more code in `gatsby-node.js`.

### Constitution Alignment
Aligns with Constitution §I (Content-First Markdown Slides) and §II (Ordered, Self-Contained
Slide Files); this ADR records the implementation mechanism those principles rely on.

### Clarifications
- 2026-10-26: Owner confirmed positional URLs are an **accepted trade-off** — the deck is
  presented live and stable deep links are not required.

### Implementation Updated (2026-10-26, ADR-007)
The decision is unchanged: Markdown files in `src/slides/`, ordered by sorted file path,
split into one slide per section, numbered `/1` … `/N`. The mechanism moved from Gatsby to
Astro:
- `src/content.config.js` (custom content loader) replaces `gatsby-node.js`. It splits the
  Markdown **source** at thematic breaks, not the rendered HTML at `<hr>`, which is close to
  the "Split at Markdown AST level" alternative above. A break counts only after a blank line
  (a setext `---` heading never splits) and outside fenced code. Empty chunks are kept, so
  numbering matches the old `split('<hr>')`.
- Frontmatter goes with the first chunk; `title` is read from it.
- Verified: slide text identical to the Gatsby production deck on 40/40 slides; split rules
  exercised with a temporary file (feature 001, T023).
- The Gatsby evidence in Context is kept as history.

### Confidence Level
HIGH - Directly readable in `gatsby-node.js`; URL trade-off confirmed by owner.

### Last Updated
2026-10-26

---

## ADR-003: In-House Presentation Runtime (Navigation, Transitions)

### Status
Accepted

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
Slides need presenter-style behaviour in the browser: next/previous navigation, touch support,
transitions, and code highlighting.

**Evidence Found**:
- `src/layouts/index.js` (via `gatsby-plugin-layout`): global `keydown` listener using
  deprecated `keyCode` (Enter/Space/→ next, ← previous) calling `navigate('/N')`
- `react-swipeable` wrapper for swipe left/right
- `src/components/transition.js`: `react-transition-group` 200ms opacity fade keyed on path
- (Removed 2026-10-26) `highlight.js` ^10.7.3 `hljs.initHighlighting()` ran client-side in
  `useEffect`; no slide contained a code block
- `src/templates/slide.js`: slide HTML injected via `dangerouslySetInnerHTML`
- Footer with Tikal logo, title, slide index; Quicksand font (self-hosted since 2026-10-26, see ADR-005)

### Decision
Presentation behaviour is implemented by a small custom React layer on top of Gatsby routing
rather than a slide framework: each slide is a route, navigation is a client-side route change.

### Consequences

#### Positive (Observed)
- Small, readable codebase; behaviour fully controllable
- Every slide is deep-linkable and works with browser history

#### Negative (Potential)
- `KeyboardEvent.keyCode` is deprecated
- No speaker notes, overview, presenter view, or print/PDF mode
- No ARIA/screen-reader support; keyboard nav only for arrows/Enter/Space

#### Risks
- Security: `dangerouslySetInnerHTML` is acceptable only because content is author-controlled
  Markdown built at compile time; accepting external content would open XSS. Mitigation
  (2026-10-26): same-origin Content-Security-Policy in `gatsby-config.js` blocks third-party
  scripts, plugins and framing; `'unsafe-inline'` remains because of Gatsby's inline scripts

### Common Alternatives
#### Embed a slide engine (reveal.js / spectacle) inside Gatsby
**Description**: Delegate navigation and presenter features to a library.
**Trade-offs**: Gains presenter tooling; adds a dependency and couples to its DOM model.

#### Build-time highlighting (`gatsby-remark-prismjs`)
**Description**: Highlight code during Markdown transform.
**Trade-offs**: No client JS for highlighting, faster render; different theme ecosystem.

### Amendments
- 2026-10-26: Client-side code highlighting (`highlight.js`) removed. No slide contained a
  code block, and the full library was ~90% of the compressed app bundle (308 KB → 33 KB).
  If code samples are added later, prefer build-time highlighting (see Common Alternatives).

### Implementation Updated (2026-10-26, ADR-007)
The decision is unchanged: an in-house presentation runtime (each slide is a route;
navigation is a client-side route change), not a slide framework. The React layer is
replaced:
- `src/scripts/navigation.js` (plain JS, no framework) replaces `src/layouts/index.js` and
  `react-swipeable`. It handles Right/Enter/Space and Left via `KeyboardEvent.key` (the
  deprecated `keyCode` is gone), swipes of ≥ 10 px, and bounds at the first and last slide.
  The current index and total are read from `#slide` data attributes at event time.
- Astro `ClientRouter` with `fade({ duration: '0.2s' })` on `#slide` replaces
  `react-transition-group`; the footer swaps without animation.
- Slide HTML is rendered by Astro's Markdown pipeline at build time; no
  `dangerouslySetInnerHTML`.
- The CSP moved from `gatsby-config.js` to `public/_headers` with the same 12 directives.
  `'unsafe-inline'` remains for Astro's inlined styles and the transition styles.
- Still open: no speaker notes, overview, presenter view, print mode or ARIA support.
- The Gatsby evidence in Context is kept as history.

### Confidence Level
HIGH - All behaviour is visible in three small files.

---

## ADR-004: Netlify Hosting with Platform-Side Builds, No Repository CI

### Status
Accepted

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
The static site must be built and published whenever content changes.

**Evidence Found**:
- `package.json`: `gatsby-adapter-netlify` ^1.4.0
- `README.md`: Netlify deploy-status badge (site `hardcore-galileo-55838f`)
- No `netlify.toml`, no `.github/workflows/`, no other CI config in the repository
- Commit `7e4560c`: "Add logging for HTML chunk length in gatsby-node.js to debug Netlify
  build" — builds are debugged on Netlify itself
- Local gate only: `.husky/pre-commit` runs `npm run format` (Prettier)

### Decision
Netlify builds and deploys the site from the repository (inferred: `master` branch), with
build settings held in the Netlify UI rather than in code. No CI pipeline in the repo.

### Consequences

#### Positive (Observed)
- Zero CI configuration to maintain; deploy previews available from Netlify
- Adapter integrates Gatsby output with Netlify features

#### Negative (Potential)
- Build configuration (Node version, command, publish dir, env) lives outside version control
- First build verification happens on Netlify, after push; failures reach the deploy pipeline
- No automated lint or test gate (ESLint 9 is installed but no `eslint.config.*` exists)

#### Risks
- Netlify-side settings drift or loss is not recoverable from the repo

### Common Alternatives
#### Commit `netlify.toml`
**Description**: Declare build command, publish dir, Node version in repo.
**Trade-offs**: Reproducible config; one more file to keep in sync.

#### GitHub Actions build check + Netlify deploy
**Description**: Run `gatsby build` on PRs before Netlify deploys.
**Trade-offs**: Earlier failure detection; extra pipeline to maintain.

#### GitHub Pages / Cloudflare Pages
**Description**: Other static hosts.
**Trade-offs**: Similar capability; different adapter and preview model.

### Constitution Alignment
Constitution §III (Green Production Build) mitigates the missing CI gate by requiring a local
`gatsby build` before committing to `master`.

### Clarifications
- 2026-10-26: Owner confirmed Netlify auto-builds and deploys from **`master`**, with build
  settings held only in the Netlify UI.

### Implementation Updated (2026-10-26, ADR-007)
The decision still holds in part: Netlify builds and deploys from the repository, with no CI
pipeline in the repo. **It changes in one respect**: build settings are no longer held in
the Netlify UI. The "Commit `netlify.toml`" alternative above is now adopted:
- `netlify.toml`: `command = "yarn build"`, `publish = "dist"`, `NODE_VERSION = "22.23.4"`.
  The Netlify Runtime field is empty (checked 2026-10-26); no Gatsby plugin remains.
- `public/_headers` and `public/_redirects` carry headers and the `/` → `/1` redirect in
  the repo; `gatsby-adapter-netlify` is removed.
- Constitution v2.0.0 §III adds a gate: a green Netlify deploy preview before merging to
  `master`.
- This resolves the "settings live outside version control" negative and the drift risk
  above. First-build verification still happens on Netlify (the first preview failed on the
  Node version and was fixed in the repo).
- The Gatsby evidence in Context is kept as history.

### Confidence Level
HIGH - Netlify use evident in repo; deploy branch and settings location confirmed by owner.

### Last Updated
2026-10-26

---

## ADR-005: Offline-Capable PWA via Service Worker

### Status
Superseded by ADR-008 (2026-10-26)

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
A live talk may be given on unreliable venue networks.

**Evidence Found**:
- `gatsby-config.js`: `gatsby-plugin-offline` enabled (service worker, precached pages/assets)
- No `gatsby-plugin-manifest` configured (no install manifest/icons)
- Quicksand 400 self-hosted in `src/resources/fonts/` (woff2, OFL 1.1) via `@font-face` in
  `src/layouts/index.css` (since 2026-10-26; previously loaded from Google Fonts)
- Images local in `src/resources/` processed by `gatsby-remark-images` (maxWidth 1920)

### Decision
The deck registers a service worker so previously visited content works offline.

### Consequences

#### Positive (Observed)
- Slides and local images remain available after first load without network

#### Negative (Potential)
- Service-worker caching can serve stale slides after a redeploy until the worker updates
- Without a manifest, it is offline-capable but not installable

#### Risks
- Stale cache during iteration can make a fixed slide appear unfixed

### Common Alternatives
#### No service worker
**Description**: Plain static hosting.
**Trade-offs**: No stale-cache surprises; deck needs network during the talk.

#### Self-hosted fonts + manifest
**Description**: Bundle fonts locally and add `gatsby-plugin-manifest`.
**Trade-offs**: Fully offline and installable; slightly larger build.

### Clarifications
- 2026-10-26: Owner confirmed offline support is **deliberate** — the deck must be presentable
  without venue network.
- 2026-10-26: Quicksand font self-hosted (weight 400 only, matching what Google Fonts served)
  so typography also works offline.

### Confidence Level
HIGH - Plugin enabled and intent confirmed by owner (2026-10-26).

### Last Updated
2026-10-26

---

## ADR-006: Evolution Strategy — Incremental Upgrades of an Aging Gatsby Starter

### Status
Superseded by ADR-007 (2026-10-26)

### Provenance
Discovered from codebase (brownfield, `/architect-init`); approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
Legacy/Inferred

### Sub-System
System

### Context
The deck dates from 2020 (`siteMetadata.date: April 8, 2020`, title "Tikal Knowledge ™ 2020")
and has been kept alive through dependency upgrades rather than rewrites.

**Evidence Found**:
- `package.json` version 2.0.0; Gatsby 5, React 18, Node `>=22`
- Commits titled "upgrade" (2025-11-07)
- Transitive security pins added as direct deps: `tar-fs`, `cookie`, `@expo/devcert`
- `gatsby-transformer-remark` pinned exactly to `6.16.0` (others use `^`)
- `highlight.js` was held at ^10.7.3 (v11 removes `initHighlighting`); removed entirely on
  2026-10-26 (see ADR-003)
- Lint toolchain mismatch: `eslint` ^9 with `@typescript-eslint/*` ^4, `babel-eslint` ^10
  (deprecated), `typescript` ^4; no ESLint config file
- `yarn.lock` present while `CLAUDE.md` documents `npm run` commands (resolved
  2026-10-26: `CLAUDE.md` now uses yarn)

### Decision
Keep the original starter architecture and upgrade dependencies in place, pinning or adding
direct dependencies where needed to resolve vulnerabilities or breakage.

### Consequences

#### Positive (Observed)
- Content and structure preserved across framework majors
- Known vulnerabilities addressed without restructuring

#### Negative (Potential)
- Direct-dependency security pins obscure intent; unclear when they can be removed
- Unused/incompatible dev tooling (ESLint stack) adds noise and false confidence
- Exact pin on `gatsby-transformer-remark` likely hides a regression; reason undocumented

#### Risks
- Evolution: a future Gatsby/Node change may force replacing the presentation runtime anyway
- Security: transitive vulnerabilities reappear unless pins are reviewed on each upgrade
- Mixed npm/yarn usage can create divergent lockfiles

### Common Alternatives
#### Use `resolutions` / `overrides` for transitive security fixes
**Description**: Package-manager-level overrides instead of direct dependencies.
**Trade-offs**: Clearer intent; manager-specific syntax.

#### Migrate to a maintained slide framework
**Description**: Port Markdown content to Slidev/Marp/reveal.js.
**Trade-offs**: Less code owned; one-time migration effort and new conventions.

### Constitution Alignment
Constitution §V requires justification for new runtime dependencies and a green build after
upgrades; the Technology section names `yarn.lock` as authoritative, and `CLAUDE.md`
was aligned to yarn commands on 2026-10-26.

### Clarifications
- 2026-10-26: Owner confirmed `tar-fs`, `cookie`, and `@expo/devcert` are direct dependencies
  **to force patched transitive versions** (security fixes), and the exact
  `gatsby-transformer-remark@6.16.0` pin avoids a regression. Review whether each pin is still
  needed on every upgrade.

### Confidence Level
HIGH - Upgrade pattern evident; pin rationale confirmed by owner.

### Last Updated
2026-10-26

---

## ADR-007: Slide Deck Built with Astro as a Static Site

### Status
Accepted

### Provenance
Created via `/architect-specify` from feature `001-gatsby-to-astro-migration` (spec, plan, research R1–R10) on 2026-10-26; approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
User/AI collaboration

### Sub-System
System

### Supersedes
ADR-001 (Gatsby static site), ADR-006 (incremental upgrades of an aging Gatsby starter)

<!-- Quality Requirements -->
<!-- perspectives: security, evolution -->

### Context

**Problem Statement:**
The deck (40 Markdown slides) was a Gatsby 5 + React 18 site kept alive by incremental
upgrades (ADR-006). The framework's weight and slowing ecosystem made every upgrade a large,
risky change for a small presentation. We need a generator that keeps the deck looking and
behaving the same, keeps Netlify hosting, and cuts maintenance.

**Forces:**
- Visual and behavioural parity: same slides, URLs `/N`, footer, keyboard/swipe navigation,
  200 ms fade (spec FR-001–FR-016)
- Constitution §V: minimal dependencies; no client UI framework without justification
- Constitution §I–II: content stays as Markdown in `src/slides/`, ordered by file name
- Netlify static hosting with committed config (ADR-004, constitution Tech Constraints)
- Long-lived deck: upgrades must stay small (Evolution perspective)

### Decision

**Decision:**
The deck is built with Astro (currently 7.4.x) as a purely static site, with no SSR and no
adapter:
- A custom content loader (`src/content.config.js`) reads `src/slides/*.md` in sorted path
  order, splits each file at thematic breaks, and renders each chunk with Astro's Markdown
  pipeline. Smart punctuation and syntax highlighting are off, to match the Gatsby output.
- `src/pages/[slide].astro` generates `/1` … `/N` (`trailingSlash: 'never'`,
  `build.format: 'file'`). A single layout, `src/layouts/Deck.astro`, renders the title and
  footer.
- Images use built-in `astro:assets` (sharp): WebP with a responsive `srcset`, capped at
  1920px by `image.breakpoints`.
- Transitions use `astro:transitions` (`ClientRouter`, 200 ms fade on `#slide`). Navigation
  is plain JavaScript (`src/scripts/navigation.js`), with no UI framework.
- Toolchain: Node pinned to 22.23.4 (the minimum Astro 7.4 accepts) in `.tool-versions`,
  `netlify.toml` and `package.json` `engines`; Yarn 1 with `yarn.lock` as the only lockfile.
- Evolution strategy: track the current Astro major, upgrading through the Spec Kit flow
  with a green deploy preview before merge (constitution §III).

**Rationale:**
Astro emits static HTML with no framework runtime and bundles Markdown, image optimisation
and view transitions in one dependency. The migration took the declared dependencies from
26 to 9 (−65%); `yarn audit` reports 0 vulnerabilities, against 29 Dependabot alerts on the
Gatsby `master`. Meanwhile the slide text stayed
identical on 40/40 slides and the maintainer judged the rendering slightly better.

### Consequences

#### Positive
- One runtime dependency (`astro`); far smaller upgrade and security surface
- No client framework: pages are static HTML plus two small module scripts
- Markdown authoring and file-name ordering unchanged; dev server reloads slides live
- Images are optimised and responsive, which the Gatsby setup did not do for these slides

#### Negative
- The custom loader (~90 lines) is project code to maintain, and relies on the content-layer
  loader API (`renderMarkdown`, `assetImports`)
- Astro majors arrive yearly and raise the Node minimum; the Node pin must move with them
- `'unsafe-inline'` stays in the CSP for Astro's inlined styles and the transition styles

#### Risks
- Loader API change in a future Astro major → mitigation: the quickstart V2 split test and
  the 40/40 text comparison catch regressions before merge
- Node floor drift between local machines and Netlify (as happened on the first preview) →
  mitigation: a single pinned version in three committed places

### Common Alternatives

#### Option A: Stay on Gatsby (ADR-001/006)
**Description:** Keep upgrading Gatsby 5 + React 18.
**Trade-offs:** No migration cost; keeps a heavy plugin tree and a slowing ecosystem.
Better only if the deck were about to be retired.

#### Option B: Eleventy (11ty)
**Description:** Minimal JS static site generator with Markdown support.
**Trade-offs:** Even fewer moving parts; image optimisation and view transitions would need
extra plugins or hand-written code.

#### Option C: Dedicated slide framework (Slidev, reveal.js, Marp)
**Description:** Markdown-driven presentation tools.
**Trade-offs:** Speaker notes, overview and PDF export built in; very hard to keep the exact
current look and `/N` URLs, which this migration required.

#### Option D: Next.js static export
**Description:** React framework with `output: 'export'`.
**Trade-offs:** Familiar React model; keeps React (constitution §V) and a heavy toolchain.

### Constitution Alignment

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| I. Content-First Markdown | ✅ Compliant | Slides remain Markdown in `src/slides/`, split at thematic breaks |
| II. Ordered Slide Files | ✅ Compliant | Plain string sort of file paths |
| III. Green Production Build | ✅ Compliant | `yarn build`; deploy preview green before merge |
| IV. Local, Optimized Assets | ✅ Compliant | Assets in `src/resources/`, widths ≤ 1920px, self-hosted fonts |
| V. Simplicity & Minimal Deps | ✅ Compliant | One runtime dependency; no client UI framework |

**Constitution References**: v2.0.0 §I–§V, Technology & Deployment Constraints

---

## ADR-008: No Offline Service Worker; Local-Build Venue Fallback

### Status
Accepted

### Provenance
Created via `/architect-specify` from feature `001-gatsby-to-astro-migration` (clarification
Q1, research R7, task T041) on 2026-10-26; approved via `/architect-clarify` on 2026-10-26

### Date
2026-10-26

### Owner
User/AI collaboration

### Sub-System
System

### Supersedes
ADR-005 (offline-capable PWA via service worker)

<!-- Quality Requirements -->
<!-- perspectives: security, evolution -->

### Context

**Problem Statement:**
The Gatsby deck registered an offline service worker (`gatsby-plugin-offline`) so slides
kept working on unreliable venue networks (ADR-005). With the move to Astro (ADR-007),
keeping offline support would need a new dependency, and the old worker is still installed
in returning visitors' browsers, where it could keep serving the stale Gatsby deck.

**Forces:**
- Constitution §V: every dependency must be justified
- Stale caches: service workers can keep serving old slides after a deploy
- Venue reliability: a live talk must not depend on Wi-Fi
- Returning visitors must reach the new deck without clearing caches manually (spec FR-019,
  SC-006)

### Decision

**Decision:**
- The site registers **no** service worker and keeps no browser-side offline cache
  (spec FR-020).
- `public/sw.js` is a kill switch at the path the Gatsby worker used. On install it calls
  `skipWaiting()`. On activate it deletes all caches, unregisters itself, and reloads open
  tabs. Browsers fetch it automatically when they check the old worker for updates;
  `public/_headers` serves it with `Cache-Control: no-cache`.
- The venue fallback is a local build: `yarn install && yarn build` while online, then
  `yarn serve` at the venue (`http://localhost:8000/1`), documented in `README.md`.

**Rationale:**
The local build covers the real risk (no network at the venue) with zero runtime machinery.
Removing the worker also removes the stale-cache failure mode. A local test on one origin
showed the kill switch removes the Gatsby worker and its 2 caches on the first load. A
control run without `sw.js` kept the worker registered across 3 loads, so the kill switch is
required (review-notes T041).

### Consequences

#### Positive
- No offline dependency; nothing can serve stale slides after a deploy
- Returning visitors are moved to the new deck automatically
- Venue fallback works with the network fully off

#### Negative
- Viewers who only open the public URL need network access; offline needs a pre-built
  local copy
- `public/sw.js` is a leftover file that must stay deployed until old workers are gone

#### Risks
- Removing `sw.js` too early would strand browsers that still hold the old worker →
  mitigation: keep it indefinitely (it is 775 bytes), or remove it only after a deliberate
  decision recorded as a new ADR
- Presenter forgets to pre-build → mitigation: the README section "Presenting without
  network"

### Common Alternatives

#### Option A: Keep a PWA (`@vite-pwa/astro`)
**Description:** Re-implement offline caching on Astro with a Workbox-based worker.
**Trade-offs:** The public URL keeps working offline after one visit; adds a dependency and
reintroduces stale-cache handling.

#### Option B: Delete `sw.js` and let the old worker fail its update check
**Description:** No file at the old worker path.
**Trade-offs:** No leftover file; the browser may keep using the old worker and its precache
for an unbounded time (the control run showed it stays registered).

#### Option C: `Clear-Site-Data` response header
**Description:** Tell browsers to wipe storage for the origin.
**Trade-offs:** No worker script needed; blunt (clears all site storage on every matching
response) and needs careful scoping and removal later.

### Constitution Alignment

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| V. Simplicity & Minimal Deps | ✅ Compliant | No offline dependency |
| Tech & Deployment Constraints | ✅ Compliant | "The site MUST NOT register a service worker"; venue fallback documented in README |
| III. Green Production Build | ✅ Compliant | Kill switch verified locally (T041) before merge; production check after merge (T038) |

**Constitution References**: v2.0.0 §V, Technology & Deployment Constraints

