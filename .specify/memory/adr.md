# Architecture Decision Records

## ADR Index

| ID | Sub-System | Decision | Status | Date | Owner |
|----|------------|----------|--------|------|-------|
| ADR-001 | System | Slide Deck Built as a Static-Site-Generated Web App (Gatsby) | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-002 | System | Slide Content Model — Markdown Files Split on `<hr>`, Ordered by File Path | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-003 | System | In-House Presentation Runtime (Navigation, Transitions, Highlighting) | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-004 | System | Netlify Hosting with Platform-Side Builds, No Repository CI | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-005 | System | Offline-Capable PWA via Service Worker | Accepted | 2026-10-26 | Legacy/Inferred |
| ADR-006 | System | Evolution Strategy — Incremental Upgrades of an Aging Gatsby Starter | Accepted | 2026-10-26 | Legacy/Inferred |

---
---

## ADR-001: Slide Deck Built as a Static-Site-Generated Web App (Gatsby)

### Status
Accepted (Discovered from codebase; approved 2026-10-26)

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
Accepted (Discovered from codebase; approved 2026-10-26)

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

### Confidence Level
HIGH - Directly readable in `gatsby-node.js`; URL trade-off confirmed by owner.

### Last Updated
2026-10-26

---

## ADR-003: In-House Presentation Runtime (Navigation, Transitions, Highlighting)

### Status
Accepted (Discovered from codebase; approved 2026-10-26)

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
- `highlight.js` ^10.7.3 `hljs.initHighlighting()` run client-side in `useEffect`, resetting
  `initHighlighting.called` on cleanup
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
- `KeyboardEvent.keyCode` is deprecated; `hljs.initHighlighting()` was removed in
  highlight.js v11, which blocks upgrading (see ADR-006)
- No speaker notes, overview, presenter view, or print/PDF mode
- No ARIA/screen-reader support; keyboard nav only for arrows/Enter/Space

#### Risks
- Security: `dangerouslySetInnerHTML` is acceptable only because content is author-controlled
  Markdown built at compile time; accepting external content would open XSS. Mitigation
  (2026-10-26): same-origin Content-Security-Policy in `gatsby-config.js` blocks third-party
  scripts, plugins and framing; `'unsafe-inline'` remains because of Gatsby's inline scripts
- Performance: highlighting runs on every render (effect has no dependency array)
- Performance: the full highlight.js build (190 language grammars) is bundled although no
  slide contains a code block; it makes up most of the ~308 KB compressed `app.js`
  (found 2026-10-26, see AD.md §4.2.1 PT-1)

### Common Alternatives
#### Embed a slide engine (reveal.js / spectacle) inside Gatsby
**Description**: Delegate navigation and presenter features to a library.
**Trade-offs**: Gains presenter tooling; adds a dependency and couples to its DOM model.

#### Build-time highlighting (`gatsby-remark-prismjs`)
**Description**: Highlight code during Markdown transform.
**Trade-offs**: No client JS for highlighting, faster render; different theme ecosystem.

### Confidence Level
HIGH - All behaviour is visible in three small files.

---

## ADR-004: Netlify Hosting with Platform-Side Builds, No Repository CI

### Status
Accepted (Discovered from codebase; approved 2026-10-26)

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

### Confidence Level
HIGH - Netlify use evident in repo; deploy branch and settings location confirmed by owner.

### Last Updated
2026-10-26

---

## ADR-005: Offline-Capable PWA via Service Worker

### Status
Accepted (Discovered from codebase; approved 2026-10-26)

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
Accepted (Discovered from codebase; approved 2026-10-26)

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
- `highlight.js` held at ^10.7.3 (v11 removes `initHighlighting`, see ADR-003)
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

