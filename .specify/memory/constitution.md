<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles (template placeholder → new title):
  - [PRINCIPLE_1_NAME] → I. Content-First Markdown Slides
  - [PRINCIPLE_2_NAME] → II. Ordered, Self-Contained Slide Files
  - [PRINCIPLE_3_NAME] → III. Green Production Build (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Local, Optimized Assets
  - [PRINCIPLE_5_NAME] → V. Simplicity & Minimal Dependencies
- Added sections: Technology & Deployment Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Deferred TODOs: none. Ratification date set to first adoption (2026-10-26); no earlier
  constitution existed.
-->

# Introduction to Data Engineering Constitution

## Core Principles

### I. Content-First Markdown Slides

- Presentation content MUST live as Markdown in `src/slides/`; slides MUST NOT be hard-coded
  inside React components or pages.
- Each slide MUST be separated by a horizontal rule (`---`), which the build splits on.
- Inline HTML/JSX in Markdown MAY be used only when plain Markdown cannot express the content
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

- `gatsby build` MUST succeed locally before any change is committed to `master`.
- A change that breaks the Netlify build MUST be fixed or reverted before other work continues.
- Debug instrumentation added to diagnose build issues (e.g., logging in `gatsby-node.js`) MUST
  be removed once the issue is resolved.

Rationale: `master` deploys directly to Netlify; a broken build means the public deck is stale
or unavailable.

### IV. Local, Optimized Assets

- Images and other static assets MUST be stored in `src/resources/` and referenced by relative
  path so `gatsby-remark-images` / `gatsby-plugin-sharp` can process them.
- Remote hot-linked images SHOULD be avoided; when used, the source MUST be stable and
  license-compatible.
- Image processing MUST stay within the configured `maxWidth` (1920px) in `gatsby-config.js`.

Rationale: local assets give responsive, offline-capable (PWA) slides and remove dependence on
third-party hosts during a live talk.

### V. Simplicity & Minimal Dependencies

- New runtime dependencies MUST be justified by a slide need that existing dependencies cannot
  meet; the justification MUST appear in the commit message or PR description.
- Reusable UI belongs in `src/components/`, layouts in `src/layouts/`; components MUST NOT be
  created for one-off content that Markdown can express.
- Dependency upgrades MUST be followed by a successful build (Principle III).

Rationale: this is a presentation, not an application. Every dependency is upgrade and security
burden with little audience-visible value.

## Technology & Deployment Constraints

- Stack: Gatsby 5, React 18, `gatsby-transformer-remark`, `gatsby-remark-images`,
  `gatsby-plugin-offline`, `highlight.js` for code highlighting.
- Runtime: Node.js >= 22 (per `package.json` `engines`).
- Package manager: `yarn.lock` is the authoritative lockfile; dependency changes MUST update it
  and MUST NOT introduce a second lockfile.
- Deployment: Netlify via `gatsby-adapter-netlify`; build command `gatsby build`, publish dir
  `public/`. Generated output in `public/` MUST NOT be hand-edited.
- Navigation MUST remain usable via keyboard arrows and touch swipe (`react-swipeable`).

## Development Workflow & Quality Gates

1. Develop with `gatsby develop` (http://localhost:8000) and visually verify changed slides.
2. JavaScript under `src/` MUST be Prettier-formatted; the husky pre-commit hook enforces this
   and MUST NOT be bypassed (`--no-verify`) except to unblock an emergency revert.
3. Before commit: run `gatsby build`; on cache-related failures run `gatsby clean` and rebuild.
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

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
