<!--
Sync Impact Report
- Version change: 2.0.0 → 2.0.1 (PATCH: wording only; no principle added, removed or redefined.
  Driven by /architect-analyze finding F2 after feature 001-gatsby-to-astro-migration.)
- Modified principles: none
- Modified sections:
  - Technology & Deployment Constraints: the Node.js runtime line now states the actual minimum
    (>= 22.23.4, required by Astro 7.4) and where it is pinned, instead of ">= 22"
- Added sections: none
- Removed sections: none
- Deferred TODOs: none
- Previous amendment: 1.0.0 → 2.0.0 (MAJOR) on 2026-10-26 for the Gatsby → Astro migration
  (analysis D1); finding D2 was resolved by moving the slide images to src/resources/.
-->

# Introduction to Data Engineering Constitution

## Core Principles

### I. Content-First Markdown Slides

- Presentation content MUST live as Markdown in `src/slides/`; slides MUST NOT be hard-coded
  inside components, layouts, or pages.
- Slides within a file MUST be separated by a thematic break (`---` on its own line, preceded by a
  blank line), which the build splits on. Frontmatter delimiters MUST NOT create slides.
- Inline HTML in Markdown MAY be used only when plain Markdown cannot express the content
  (e.g., layout or interactive elements); the reason SHOULD be evident from the slide itself.

Rationale: the deck exists to teach data engineering. Keeping content in Markdown lets it be
edited, reviewed, and diffed without touching presentation code.

### II. Ordered, Self-Contained Slide Files

- Slide files MUST follow the `NN-topic[suffix].md` naming pattern (e.g., `11-persisting04.md`),
  because files are loaded in sorted path order and the name defines presentation order.
- A new slide inserted mid-deck MUST use a name that sorts into the intended position; existing
  files MUST NOT be renamed solely for cosmetic reasons, to keep history readable.
- Each file SHOULD cover one topic or sub-topic so it can be reordered or removed independently.

Rationale: ordering is implicit in file names; a predictable scheme prevents slides silently
appearing in the wrong place.

### III. Green Production Build (NON-NEGOTIABLE)

- `yarn build` MUST succeed locally before any change is committed.
- A branch MUST have a green Netlify deploy preview before it is merged to `master`.
- A change that breaks the Netlify build MUST be fixed or reverted before other work continues.
- Debug instrumentation added to diagnose build issues (e.g., logging in the content loader) MUST
  be removed once the issue is resolved.

Rationale: `master` deploys directly to Netlify; a broken build means the public deck is stale
or unavailable.

### IV. Local, Optimized Assets

- Images and other static assets MUST be stored in `src/resources/` and referenced by relative
  path so the build's image pipeline can optimize them.
- Remote hot-linked images SHOULD be avoided; when used, the source MUST be stable and
  license-compatible.
- Generated responsive image widths MUST NOT exceed 1920px.
- Fonts MUST be self-hosted; slides MUST NOT depend on third-party hosts at runtime.

Rationale: local, optimized assets keep slides fast and remove dependence on third-party hosts
during a live talk.

### V. Simplicity & Minimal Dependencies

- New runtime dependencies MUST be justified by a slide need that existing dependencies cannot
  meet; the justification MUST appear in the commit message or PR description.
- A client-side UI framework (React, Vue, Svelte, etc.) MUST NOT be added unless that
  justification shows plain HTML/CSS and small vanilla scripts cannot meet the need.
- Layouts belong in `src/layouts/`, client scripts in `src/scripts/`; reusable components, if ever
  needed, in `src/components/`. Components MUST NOT be created for one-off content that Markdown
  can express.
- Dependency upgrades MUST be followed by a successful build (Principle III).

Rationale: this is a presentation, not an application. Every dependency is upgrade and security
burden with little audience-visible value.

## Technology & Deployment Constraints

- Stack: Astro (static output, no SSR adapter), Markdown slides loaded through an Astro content
  collection, built-in `astro:assets` image optimization, `astro:transitions` for slide
  transitions, and vanilla JavaScript for navigation.
- Runtime: Node.js >= 22.23.4 (the Astro 7.4 minimum), pinned in `.tool-versions`,
  `netlify.toml` (`NODE_VERSION`) and `package.json` `engines`.
- Package manager: `yarn.lock` is the authoritative lockfile; dependency changes MUST update it
  and MUST NOT introduce a second lockfile.
- Deployment: Netlify static hosting. Build command and publish directory (`dist/`) MUST be set in
  the committed `netlify.toml`; response headers (CSP, Permissions-Policy, and other security
  headers) MUST be set in the committed `public/_headers`. Generated output in `dist/` MUST NOT
  be hand-edited or committed.
- Security headers MUST NOT be loosened without a recorded rationale in the PR description.
- The site MUST NOT register a service worker or other browser-side offline cache. The venue
  fallback for unreliable networks is a local build (`yarn build && yarn serve`), documented in
  `README.md`.
- Navigation MUST remain usable via keyboard (Right Arrow / Enter / Space forward, Left Arrow
  back) and touch swipe, bounded at the first and last slide.

## Development Workflow & Quality Gates

1. Develop with `yarn develop` (http://localhost:8000) and visually verify changed slides.
2. Source under `src/` (JavaScript and `.astro`) MUST be Prettier-formatted; the husky pre-commit
   hook enforces this and MUST NOT be bypassed (`--no-verify`) except to unblock an emergency
   revert.
3. Before commit: run `yarn build`; on cache-related failures run `yarn clean` and rebuild.
4. Feature work planned via Spec Kit (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks`)
   MUST pass `/speckit-analyze` with no CRITICAL findings before `/speckit-implement`.
5. No automated test suite exists; verification is the green build plus manual slide review.
   Any future test tooling MUST be added to this section by amendment.

## Governance

- This constitution supersedes conflicting guidance; `CLAUDE.md` provides runtime development
  guidance and MUST stay consistent with it.
- Amendments: edit this file via `/speckit-constitution`, update the Sync Impact Report, and bump
  the version in the same commit.
- Versioning: MAJOR for removing or redefining a principle; MINOR for adding a principle or
  section or materially expanding guidance; PATCH for clarifications and wording.
- Compliance: every spec, plan, and task list MUST be checked against these principles
  (`/speckit-analyze` treats violations as CRITICAL); exceptions MUST be recorded with rationale
  in the relevant plan.

**Version**: 2.0.1 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
