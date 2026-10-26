# Feature Specification: Migrate the Slide Deck from Gatsby to Astro

**Feature Branch**: `001-gatsby-to-astro-migration`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Migrate the slide deck from Gatsby to Astro, keeping Netlify deployment and identical slide appearance/behaviour." Full mission brief: `mission-brief-gatsby-to-astro.md` (session scratchpad, 2026-10-26).

## Mission Brief

**Goal**: Replace the deck's site generator (Gatsby 5 and its React runtime) with Astro, so the deck is simpler to maintain and has far fewer dependencies, while the audience sees and uses exactly the same presentation, still served from Netlify.

**Constraints**: Slide content, order and design do not change. Deployment stays on Netlify, built from `master`. Project constitution v1.0.0 applies: Markdown-first content (§I), file-name ordering (§II), green build (§III), local assets (§IV), minimal dependencies (§V). Yarn stays the only package manager.

**Team context**: `team-context.md` (pre-commit security checklist: CSP headers, no secrets, dependency audit).

## Clarifications

### Session 2026-10-26

- Q: Keep offline (PWA) support or drop it? → A: Drop offline support. Retire the old Gatsby service worker. The venue fallback is the presenter running a locally built copy, documented in the README. ADR-005 is superseded.
- Q: Visual-parity tolerance? → A: Side-by-side visual review by the maintainer: "no difference a viewer would notice", across all slides at desktop and mobile sizes. No pixel-diff tooling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Audience views the deck unchanged (Priority: P1)

An audience member (or the presenter) opens the deck URL and moves through all slides. Every slide shows the same text, images, fonts, colours, layout and footer as before the migration. The browser tab title is unchanged.

**Why this priority**: Visual and content parity is the core promise. If the deck looks different, the migration has failed whatever else improved.

**Independent Test**: Build the deck and capture every slide at desktop and mobile size. Compare against captures of the current production deck.

**Acceptance Scenarios**:

1. **Given** the migrated deck is deployed, **When** a viewer opens `/1` through `/40`, **Then** each slide matches the corresponding pre-migration slide in content, order and appearance.
2. **Given** any slide, **When** it is displayed, **Then** the footer shows the Tikal logo, the title "Tikal Knowledge ™ 2020" and the current slide number, styled as before.
3. **Given** any slide, **When** the viewer looks at the browser tab, **Then** the title reads "Tikal Knowledge ™ 2020 — Sigal Shaharabani".
4. **Given** a slide containing an image (e.g. "About Me"), **When** it is displayed, **Then** the image appears at the same position, and is no taller than before, on desktop and mobile.
5. **Given** a phone-width screen (≤ 600px), **When** a slide is displayed, **Then** the reduced base font size and responsive layout apply as before.

---

### User Story 2 - Presenter navigates the deck as before (Priority: P1)

The presenter moves forward and back with the keyboard during a live talk, or by swiping on a touch device. Slides change with the same brief fade.

**Why this priority**: Navigation is used in every talk. A regression here is immediately visible on stage.

**Independent Test**: On the deployed deck, use each navigation input from the first, a middle and the last slide, and watch the URL and the slide.

**Acceptance Scenarios**:

1. **Given** slide *n* (not the last), **When** the presenter presses Right Arrow, Enter or Space, **Then** slide *n+1* is shown and the URL becomes `/n+1`.
2. **Given** slide *n* (not the first), **When** the presenter presses Left Arrow, **Then** slide *n−1* is shown.
3. **Given** the first slide, **When** Left Arrow is pressed, **Then** nothing happens. **Given** the last slide, **When** a "next" key is pressed, **Then** nothing happens.
4. **Given** a touch device, **When** the presenter swipes left or right, **Then** the deck moves to the next or previous slide, within the same bounds.
5. **Given** any slide change, **When** it happens, **Then** the outgoing slide fades out and the incoming one fades in over about 200 ms.

---

### User Story 3 - Links and URLs keep working (Priority: P2)

Someone opens a link to a specific slide that was shared earlier, or the bare site address, or a mistyped address.

**Why this priority**: Existing shared links (e.g. `/12`) must not break. It matters less than the live-talk experience.

**Independent Test**: Request the root URL, a numbered slide URL, the same URL with a trailing slash, and an unknown path on the deployed site.

**Acceptance Scenarios**:

1. **Given** the deck is deployed, **When** a viewer opens `/`, **Then** they land on slide 1 (`/1`), and Back does not return them to the bare root.
2. **Given** a slide URL like `/12`, **When** it is opened directly, **Then** slide 12 is shown, with no trailing slash added to the URL.
3. **Given** an unknown path, **When** it is opened, **Then** the existing "NOT FOUND" page is shown.

---

### User Story 4 - Maintainer edits and deploys slides with less tooling (Priority: P2)

The maintainer adds or edits a Markdown slide file, runs the local dev server and production build with the familiar `yarn` scripts, and pushes to `master`. Netlify builds and publishes the update.

**Why this priority**: The reason for the migration is lower maintenance. The authoring workflow must stay the same or get simpler.

**Independent Test**: Add a temporary slide file with a mid-deck name. Run the dev server and the production build, and confirm the slide appears in the right position. Push a branch and confirm the Netlify deploy preview succeeds.

**Acceptance Scenarios**:

1. **Given** a new file `NN-topic.md` in `src/slides/`, **When** the deck is built, **Then** it appears in the position its file name sorts to, and later slides are renumbered.
2. **Given** a slide file whose body contains a `---` separator, **When** the deck is built, **Then** that file produces two slides.
3. **Given** `yarn develop`, `yarn build`, `yarn clean` and `yarn format`, **When** each is run, **Then** it does the equivalent job it does today.
4. **Given** a push to `master`, **When** Netlify builds, **Then** the build succeeds with no manual Netlify configuration beyond what is committed to the repository.

---

### User Story 5 - Deck stays secure, old cache is retired, venue fallback is documented (Priority: P3)

The deck is served with the same security headers. Browser-side offline caching is removed on purpose. Returning visitors who still have the old offline worker get the new deck, not a stale copy. A presenter worried about venue Wi-Fi can follow a documented step to run the deck from a local build on their laptop.

**Why this priority**: Security headers must not silently disappear, and a leftover worker could hide the migration from returning visitors. Both rarely matter during a talk.

**Independent Test**: Inspect response headers on the deploy preview. Open the old production deck in a browser, deploy the migration, revisit, and confirm the new deck loads and no worker stays registered. Follow the README fallback steps with the network off.

**Acceptance Scenarios**:

1. **Given** any deployed page, **When** its response headers are inspected, **Then** Content-Security-Policy and Permissions-Policy are present, and at least as strict as today.
2. **Given** a returning visitor whose browser still has the old Gatsby offline worker, **When** they open the migrated deck, **Then** the old worker unregisters, its caches are cleared, and they see the migrated deck.
3. **Given** a fresh visitor, **When** they open the migrated deck, **Then** no offline worker is installed.
4. **Given** a presenter with no network, **When** they follow the README venue-fallback steps on a machine that has a built copy, **Then** the full deck runs locally, with navigation working.

---

### Edge Cases

- **Separator rendering**: the Markdown renderer may emit the slide separator as `<hr>` or `<hr />`. Both must split slides, and frontmatter `---` must never be treated as a separator.
- **Sort order**: file names with suffixes (`11-persisting04.md` vs `11-persisting.md`) must keep their current relative order (plain string sort of the path).
- **Image file names**: image references with unusual names or extensions (`me.JPG`, `CAP-Theorem-last.jpg`, `Casestudy.png`) must resolve, keeping case-sensitive extensions.
- **Rapid key presses**: pressing a "next" key quickly several times must not skip past the last slide, or show two slides overlapping after the fade.
- **Stale cache from the old worker**: a visitor whose old Gatsby worker serves a cached page before the new site loads must still be moved to the new deck within one or two loads, with no manual cache clearing.
- **Trailing slash**: `/12/` must reach slide 12 (or redirect to `/12`), not the 404 page.

## Requirements *(mandatory)*

### Functional Requirements

**Content & ordering**

- **FR-001**: The deck MUST be generated from the Markdown files in `src/slides/`, without moving content into code (constitution §I).
- **FR-002**: Slides MUST be ordered by sorting slide file paths as plain strings, matching current behaviour (constitution §II).
- **FR-003**: Each file MUST be split into multiple slides wherever its body contains a horizontal-rule separator. Frontmatter MUST NOT produce extra slides.
- **FR-004**: Slides MUST be numbered consecutively from 1. With current content that gives exactly 40 slides, with the same content in the same positions as production today.

**Routing**

- **FR-005**: Each slide MUST be reachable at `/<number>` with no trailing slash.
- **FR-006**: `/` MUST send the viewer to `/1`, replacing the history entry.
- **FR-007**: Unknown paths MUST show the existing "NOT FOUND" page and copy.

**Presentation parity**

- **FR-008**: The deck MUST use the existing stylesheet rules (colours, spacing, typography, footer, blockquote, code, side-by-side, mobile breakpoint) with no visible change.
- **FR-009**: The self-hosted Quicksand font MUST still be served locally, with no third-party font requests.
- **FR-010**: Every slide MUST show the footer with the logo, the site title and the current slide number.
- **FR-011**: The document title MUST be "Tikal Knowledge ™ 2020 — Sigal Shaharabani".
- **FR-012**: Images referenced from slides MUST be served from the repository, optimised and responsive up to 1920px wide, and keep the existing on-screen size limits.
- **FR-013**: Slide changes MUST use an opacity fade of about 200 ms.
- **FR-014**: Visual parity MUST be verified by the maintainer's side-by-side visual review of every slide against the pre-migration deck, at desktop (1920×1080) and mobile (375×812). The pass bar is "no difference a viewer would notice". Any noticed difference MUST be fixed, or recorded and accepted in the PR description.

**Navigation**

- **FR-015**: Right Arrow, Enter and Space MUST go to the next slide. Left Arrow MUST go to the previous slide. Neither may go past the first or last slide.
- **FR-016**: On touch devices, swiping left MUST go to the next slide and swiping right to the previous slide, with the same bounds.

**Deployment & security**

- **FR-017**: The deck MUST build and deploy on Netlify from `master`, with all build and header configuration committed to the repository.
- **FR-018**: All responses MUST carry the current Content-Security-Policy directives and Permissions-Policy, or stricter ones.
- **FR-019**: The migrated site MUST retire the previously installed Gatsby offline worker on returning visitors' browsers: unregister it and clear its caches.
- **FR-020**: The migrated site MUST NOT install any offline worker or browser-side offline cache. The README MUST document a venue fallback: building the deck and serving it locally with no network.

**Maintainability**

- **FR-021**: All Gatsby packages and the React runtime libraries MUST be removed from the project dependencies. Every new dependency MUST be justified (constitution §V).
- **FR-022**: The `develop`, `build`, `clean` and `format` scripts MUST keep their names and purposes. Automatic formatting on commit MUST cover the new source file types.
- **FR-023**: `yarn.lock` MUST stay the only lockfile.
- **FR-024**: The project governance docs MUST describe the new stack in the same change: constitution (MAJOR amendment), ADRs (superseding ADR-001 and ADR-005, plus ADR-003 and ADR-006 as affected), `AD.md`, `CLAUDE.md` and `README.md`.

### Key Entities

- **Slide file**: a Markdown file in `src/slides/` with a `title` in its frontmatter. Its name sets its order, and it holds one or more slides.
- **Slide**: one displayable unit, with a 1-based sequential number, rendered content and a URL `/<number>`.
- **Site metadata**: presenter name, deck title and date, shown in the footer and the page title.
- **Asset**: an image or font referenced by slides or styles, stored locally in the repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In side-by-side review, 100% of slides (40 of 40 with current content, at both desktop and mobile sizes = 80 comparisons) show no difference a viewer would notice, or have their difference recorded and accepted.
- **SC-002**: All 5 navigation inputs (Right, Enter, Space, Left, swipe left/right) behave as specified on the first, a middle and the last slide. That makes 0 failures across 15 checks.
- **SC-003**: The production build succeeds on the first Netlify deploy after merge, with no manual dashboard changes.
- **SC-004**: Runtime and build dependencies listed in `package.json` drop by at least 50% compared with today (19 runtime + 7 dev = 26).
- **SC-005**: Response headers on every page include the same 12 CSP directives and Permissions-Policy (or stricter), checked on the deploy preview and on production.
- **SC-006**: A returning visitor with the old offline worker sees the migrated deck on their first or second page load.
- **SC-007**: A maintainer can add a new slide and see it in the local dev preview using only the existing workflow (edit Markdown, run the dev script), with no new steps.
- **SC-008**: No mention of Gatsby remains in the constitution, active ADRs, `AD.md`, `CLAUDE.md` or `README.md`, except as superseded history.

## Assumptions

- "Look the same" means the audience sees no difference. Internal markup, class names and generated file names may change.
- Gatsby's blur-up image placeholder is not part of the required look. The final rendered image must still match.
- The 3 slide images that sat next to slide files in `src/slides/` move to `src/resources/` before the migration (constitution §IV; analysis D2, 2026-10-26). Their Markdown references become `../resources/<file>`. This is a location change only; what renders is unchanged.
- Astro's latest stable release is the target. The Node ≥ 22 / Yarn 1 toolchain in `.tool-versions` stays.
- The local dev server port may change from 8000; docs are updated to match.
- Cutover happens through a branch and Netlify deploy preview, then merge to `master`. No parallel Netlify site is created.
- There is no automated test suite (constitution, Quality Gates §5). Verification is the green build, side-by-side visual review and manual checks. No screenshot-diff tooling is added.
- Dropping offline support is accepted (clarification 2026-10-26). The local-build fallback covers unreliable venues.
- Out of scope: slide content or design changes, new presentation features (speaker notes, overview, PDF export), repository CI, renaming slide files.
