# Implementation Plan: Migrate the Slide Deck from Gatsby to Astro

**Branch**: `001-gatsby-to-astro-migration` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-gatsby-to-astro-migration/spec.md`

## Summary

Replace Gatsby 5 + React 18 with a static Astro 7 build that produces the same 40-slide deck at `/1`…`/40`, with the same stylesheet, footer, title, keyboard/swipe navigation and 200 ms fade. It deploys to Netlify from a committed `netlify.toml`.

- **Slides**: a custom content loader splits each Markdown file's source at thematic breaks and renders each chunk with Astro's Markdown pipeline, so relative images keep being optimised.
- **Navigation**: one vanilla-JS module plus Astro's `ClientRouter` replaces React, react-swipeable and react-transition-group.
- **Netlify files**: `_headers` carries the existing CSP and security headers. `_redirects` maps `/` → `/1`.
- **Offline**: a kill-switch `sw.js` retires the old Gatsby offline worker. Offline support is dropped in favour of a documented local-build fallback (clarification Q1).
- **Docs**: the constitution, ADRs, `AD.md`, `CLAUDE.md` and `README.md` are updated in the same change.

## Technical Context

**Language/Version**: JavaScript (ES modules) and `.astro` components; Node.js 22.23.2 (`.tool-versions`, `engines >= 22`)

**Primary Dependencies**: `astro@^7.4.2` (runtime, with built-in sharp image service and `astro:transitions`); dev: `prettier-plugin-astro@^1.1.2`, plus existing `prettier`, `husky`

**Storage**: N/A. Content is Markdown files in `src/slides/`, read at build time.

**Testing**: No automated suite (constitution, Quality Gates §5). Verification is `yarn build`, the [quickstart.md](quickstart.md) checks, and side-by-side visual review (clarification Q2).

**Target Platform**: Static site on Netlify CDN; evergreen desktop and mobile browsers (View Transitions where supported, simulated fallback elsewhere)

**Project Type**: Static website (single project)

**Performance Goals**: None set. Explicitly rejected for this small presentation site (architecture analysis, 2026-10-26).

**Constraints**:
- No visible change to the slides.
- URLs `/<n>` with no trailing slash.
- CSP no looser than today.
- No service worker for new visitors.
- `yarn.lock` is the only lockfile.

**Scale/Scope**: 40 Markdown files → 40 slides; 3 slide images, 1 logo, 2 font files; about 10 source files after migration

No NEEDS CLARIFICATION remain. Platform behaviours still to confirm are listed as **Verify** items in [research.md](research.md) (R1, R3, R6, R7) and checked in [quickstart.md](quickstart.md) V5.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0. This feature makes a MAJOR amendment to v2.0.0 in the same change (FR-024). Gates are judged against the principles' *intent*. Literal Gatsby wording is the amendment's subject, not a violation.

| Principle | Gate | Pre-research | Post-design |
|---|---|---|---|
| I. Content-First Markdown | Content stays in `src/slides/*.md`; `---` splits slides | ✅ Loader reads the same files; no content moves into code | ✅ R2 split rules match `<hr>` semantics, including setext headings |
| II. Ordered, Self-Contained Files | Plain string path sort defines order; no renames | ✅ | ✅ data-model SlideFile ordering; quickstart V2 |
| III. Green Production Build | Build passes locally before commit; Netlify build green | ✅ `yarn build` → `astro build` | ✅ `netlify.toml` committed; §III wording amended from `gatsby build` |
| IV. Local, Optimized Assets | Local assets, optimised, ≤ 1920 px | ✅ The 3 images moved from `src/slides/` to `src/resources/` (T040, fixing the existing gap) | ✅ R5: `astro:assets` + constrained layout, all assets in `src/resources/` |
| V. Simplicity & Minimal Deps | New deps justified; fewer deps | ✅ 26 → 9 declared deps | ✅ Only `astro` and `prettier-plugin-astro` added, both justified in R9 / PR |
| Tech & Deployment Constraints | Netlify, Yarn, navigation by keys and swipe | ✅ (stack wording amended) | ✅ contracts/navigation.md; R8 |
| Workflow & Quality Gates | Prettier on commit; `/speckit-analyze` before implement | ✅ | ✅ Prettier extended to `.astro`; analyze runs after `/speckit-tasks` |

**Result**: PASS. The ⚠️ on §IV is an existing state and is resolved by the planned amendment, not left as an exception. Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-gatsby-to-astro-migration/
├── spec.md              # Feature spec (clarified)
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10
├── data-model.md        # Phase 1: SlideFile, Slide, SiteMetadata, Asset, nav state
├── quickstart.md        # Phase 1: validation run guide V0–V7
├── contracts/
│   ├── routes.md        # URL space + response headers + page document contract
│   └── navigation.md    # Presenter input → navigation contract
├── team-context.md      # team-ai-directives discovery
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
astro.config.mjs           # NEW  trailingSlash 'never', build.format 'file', redirects '/'→'/1', image.layout
netlify.toml               # NEW  build command + publish = "dist"
package.json               # CHANGED  deps, scripts (develop/build/clean/format/serve)
.prettierrc                # CHANGED  drop global babel parser; astro plugin + override
.gitignore                 # CHANGED  un-ignore public/; ignore dist/, .astro/
public/
├── _headers               # NEW  CSP, Permissions-Policy, nosniff, X-Frame-Options, Referrer-Policy, cache rules
├── _redirects             # NEW  "/  /1  302!"
└── sw.js                  # NEW  kill-switch for the Gatsby offline worker
src/
├── content.config.js      # NEW  `slides` collection, custom loader (sort, split, renderMarkdown)
├── site.js                # NEW  SiteMetadata (replaces gatsby-config siteMetadata)
├── layouts/
│   ├── Deck.astro         # NEW  <html>, <head> (title, viewport, ClientRouter), #slide, footer
│   └── index.css          # KEPT unchanged (optional scoped img rule only if V3 needs it)
├── scripts/
│   └── navigation.js      # NEW  keyboard + swipe → navigate()
├── pages/
│   ├── [slide].astro      # NEW  getStaticPaths from collection; renders <Content />
│   └── 404.astro          # NEW  "NOT FOUND" copy inside Deck layout (no slide number, no nav)
├── resources/             # KEPT logo.png, fonts/ + 3 slide images (moved here by T040)
└── slides/                # KEPT 40 × .md only (3 image refs now ../resources/…)

DELETED: gatsby-config.js, gatsby-node.js, src/templates/slide.js,
         src/components/transition.js, src/layouts/index.js,
         src/pages/index.js, src/pages/404.js

DOCS:    .specify/memory/constitution.md (v2.0.0), .specify/memory/adr/ADR-007.md, ADR-008.md,
         ADR-001/005/006 status → Superseded, ADR-002/003 notes, adr/index.md,
         AD.md (regenerated), CLAUDE.md, README.md
```

**Structure Decision**: Single static Astro project laid out the way Astro expects (`src/pages`, `src/layouts`, `public/`). The existing `src/slides`, `src/resources` and `src/layouts/index.css` stay where they are, so the font URLs in the CSS and the slide image paths don't change. `src/components/` is removed because nothing reusable is left (constitution §V: no one-off components). The navigation script is a single module under 100 lines (team rule CDR-2026-022).

### Accepted behaviour differences (pre-agreed, list in PR)

- The 404 page shows the footer **without** a slide number, and keyboard navigation does nothing there. Gatsby showed "1" and navigated from slide 1, a side effect of its default `data`.
- The dev server stays on port 8000. Astro's dev toolbar is disabled (`devToolbar.enabled: false`) so local screenshots match production.

## Complexity Tracking

Not needed: the Constitution Check passes with no unjustified violations.
