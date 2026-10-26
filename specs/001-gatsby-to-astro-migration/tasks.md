---

description: "Task list for migrating the slide deck from Gatsby to Astro"
---

# Tasks: Migrate the Slide Deck from Gatsby to Astro

**Input**: Design documents from `/specs/001-gatsby-to-astro-migration/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: None requested. The constitution has no automated test suite (Quality Gates §5). Verification tasks run the matching [quickstart.md](quickstart.md) checks (V0–V7) instead.

**Organization**: Tasks are grouped by user story so each story can be completed and checked on its own.

**Commit rule (constitution §III)**: commit only at a **Checkpoint** where `yarn build` passes. Phase 1 and Phase 2 leave the tree unbuildable until T013, so they land as one commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5, from spec.md)
- Paths are repository-relative (single static project, see plan.md § Project Structure)

---

## Phase 0: Governance Prerequisites ✅ (done 2026-10-26)

**Purpose**: Make the constitution and repo layout compliant *before* any migration code lands (analysis findings D1, D2). Task IDs are kept stable for traceability, so T030 and T040 appear out of numeric order.

- [x] T030 Amend `.specify/memory/constitution.md` to v2.0.0 (MAJOR) via `/speckit-constitution`. Changes:
  - §I separator wording
  - §III `yarn build` plus a green deploy preview before merge
  - §IV with no Gatsby references, a ≤ 1920px output rule and self-hosted fonts
  - §V with no client UI framework without justification
  - Tech & Deployment: the Astro stack, committed `netlify.toml` and `public/_headers`, no service worker, and the venue fallback
  - Workflow `yarn` scripts

  The Sync Impact Report was updated. *(Moved from Phase 8 — fixes D1.)*
- [x] T040 Move the slide images into `src/resources/` per constitution §IV (fixes D2): `src/slides/me.JPG`, `src/slides/CAP-Theorem-last.jpg` and `src/slides/Casestudy.png`, moved with `git mv`. Update the references in `src/slides/03-about-me.md`, `src/slides/06-cap3.md` and `src/slides/13-case-study02.md` to `../resources/<file>`. Verified with a green Gatsby `yarn build`, with the images rendered on slides `/3`, `/9` and `/39`.

**Checkpoint**: The constitution is at v2.0.0 and all assets are in `src/resources/`. Commit this as its own commit on the branch (the Gatsby build is green).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture the baseline, swap the toolchain, and remove Gatsby.

- [ ] T001 *(headers + per-slide HTML captured 2026-10-26 in session scratchpad; screenshots and the browser profile with the Gatsby worker still to do — production keeps serving Gatsby until merge)* Capture the pre-migration baseline per quickstart.md V0. Open production `/1`…`/40` at 1920×1080 and 375×812 for side-by-side review. Save `curl -sI https://hardcore-galileo-55838f.netlify.app/1` output to the session scratchpad (not the repo). In one browser profile, visit production so it holds the Gatsby service worker (needed for T038).
- [x] T002 Rewrite `package.json`:
  - Remove all 19 entries under `dependencies` (every `gatsby*` package, `react`, `react-dom`, `react-helmet`, `react-swipeable`, `react-transition-group`, `prop-types`, `@expo/devcert`, `cookie`, `tar-fs`). Add `"astro": "^7.4.2"`.
  - Add `"prettier-plugin-astro": "^1.1.2"` to `devDependencies`. Keep the other devDependencies.
  - Set `scripts` to: `develop` = `astro dev --port 8000`, `build` = `astro build`, `clean` = `rm -rf dist .astro node_modules/.astro`, `serve` = `astro preview --port 8000`, `format` = `prettier --write "src/**/*.{js,astro}" "*.mjs"`. Keep `prepare` and `test`.
  - Change `description` to "Introduction to data engineering presentation with Astro", and `keywords` to `["astro", "presentation"]`.
  - Run `yarn install` to regenerate `yarn.lock`. Do not create `package-lock.json`.
- [x] T003 [P] Create `astro.config.mjs` with `defineConfig({ trailingSlash: 'never', build: { format: 'file' }, image: { layout: 'constrained', breakpoints: [640, 750, 828, 1080, 1280, 1668, 1920] }, devToolbar: { enabled: false } })` (research R3, R5; plan § Accepted differences). The `breakpoints` list caps generated responsive widths at 1920px, which constitution §IV requires. Astro's defaults go higher.
- [x] T004 [P] Update `.gitignore`: remove the `.cache/` and `public/` lines and the "Build directory" comment, and add `dist/` and `.astro/` (research R8).
- [x] T005 [P] Update `.prettierrc`: remove `"parser": "babel"`, add `"plugins": ["prettier-plugin-astro"]`, and add `"overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]` (research R8).
- [x] T006 [P] Create `netlify.toml` with `[build]`, `command = "yarn build"`, `publish = "dist"` (FR-017, research R8).
- [x] T007 Delete the Gatsby source files: `gatsby-config.js`, `gatsby-node.js`, `src/templates/slide.js`, `src/components/transition.js`, `src/layouts/index.js`, `src/pages/index.js`, `src/pages/404.js`. Remove the now-empty `src/templates/` and `src/components/`. Keep `src/layouts/index.css`, `src/resources/` and `src/slides/` untouched.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The slide collection, layout and slide route that every story renders through.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 [P] Create `src/site.js` exporting `site = { name: 'Sigal Shaharabani', title: 'Tikal Knowledge ™ 2020', date: 'April 8, 2020' }` (data-model.md § SiteMetadata).
- [x] T009 Create `src/content.config.js` defining a `slides` collection with an inline custom loader (research R2, data-model.md § Slide). The loader should:
  1. List `src/slides/*.md` and sort the paths as plain strings.
  2. For each file, separate the YAML frontmatter and read its `title`.
  3. Split the body into chunks at lines that match `^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$`, only when the previous line is blank (or it is the body's first line), and never inside fenced code (lines starting with ` ``` ` or `~~~` toggle fence state). Keep empty chunks.
  4. Render each chunk with `renderMarkdown(chunk, { fileURL: new URL(<file path>, config.root) })`.
  5. `store.set({ id: String(index), data: { index, title, source }, rendered })`, with `index` running consecutively from 1.
  6. Throw `no slides found in src/slides` if zero entries result.

  Keep the file under about 100 lines (team rule CDR-2026-022).
- [x] T010 Create `src/layouts/Deck.astro`. Props are `index` (number or undefined) and `total` (number or undefined). It renders:
  - `<html lang="en">`
  - `<head>` with `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, and `<title>{site.title} — {site.name}</title>`
  - an import of `./index.css` in the frontmatter
  - `<body>` containing `<div id="slide" data-index={index} data-total={total} style="width:100%;height:100vh"><slot /></div>`
  - `<footer>` with `<img class="footer__logo" src={logo.src} alt="Tikal">` (logo imported from `../resources/logo.png`), `<div>{site.title}</div>` and `<div>{index}</div>`

  Copy the markup order and class names from the deleted `src/layouts/index.js` so `src/layouts/index.css` applies unchanged (contracts/routes.md § Page document contract).
- [x] T011 Create `src/pages/[slide].astro`. `getStaticPaths()` calls `getCollection('slides')`, sorts by `data.index`, and returns `{ params: { slide: String(index) }, props: { entry, total } }`. The page renders `const { Content } = await render(entry)` inside `<Deck index={entry.data.index} total={total}><div class="slide-content"><Content /></div></Deck>`.
- [x] T012 Run `yarn format`, then `yarn build`. Expect `dist/1.html`…`dist/40.html`. If the build reports sharp missing, add `sharp` to `dependencies` and note why in the PR (research R1, R9).

**Checkpoint**: `yarn build` passes and `yarn develop` serves `/1`…`/40`. Commit Phases 1–2 together.

---

## Phase 3: User Story 1 - Audience views the deck unchanged (Priority: P1) 🎯 MVP

**Goal**: Every slide looks exactly as before: content, order, images, fonts, footer and title.

**Independent Test**: quickstart.md V3. Side-by-side review of all 40 slides at desktop and mobile against the T001 baseline.

- [x] T013 [US1] Compare the image slides `/3` (me.JPG), `/9` (CAP-Theorem-last.jpg) and `/39` (Casestudy.png), all now in `src/resources/`, against the baseline. If centring or size differs, add a scoped rule to `src/layouts/index.css`, e.g. `.slide-content img { display: block; margin: 0 auto; }`, matching Gatsby's `gatsby-resp-image-wrapper` (research R5). Otherwise leave the CSS untouched.
- [x] T014 [US1] Do the full side-by-side review of quickstart.md V3 (40 slides × 2 sizes = 80 comparisons) against the T001 baseline, using `yarn build && yarn serve`. Check footer colour, logo and number, the browser tab title, list and blockquote indentation, and the ≤ 600px font size. Record every noticed difference, with its resolution or acceptance, in `specs/001-gatsby-to-astro-migration/review-notes.md` (FR-014, SC-001).
- [x] T015 [US1] In DevTools Network on `/1`, confirm the fonts load from the site's own origin (`/_astro/*.woff2`) and nothing is requested from a third-party host (FR-009).

**Checkpoint**: The deck looks identical. Commit.

---

## Phase 4: User Story 2 - Presenter navigates the deck as before (Priority: P1)

**Goal**: Keyboard and swipe navigation with bounds, plus the 200 ms slide fade.

**Independent Test**: quickstart.md V4 on `/1`, `/20` and `/40` (contracts/navigation.md).

- [x] T016 [P] [US2] Create `src/scripts/navigation.js` per contracts/navigation.md:
  - `go(delta)` reads `#slide` `dataset.index` and `dataset.total` at call time. It returns early when they're missing (404 page) or out of bounds; otherwise it calls `navigate('/' + (n + delta))` from `astro:transitions/client`.
  - A `document` `keydown` listener maps `ArrowRight`, `Enter` and `' '` → `go(1)`, and `ArrowLeft` → `go(-1)`, with no `preventDefault`.
  - `touchstart` and `touchend` listeners on `document` compute `dx` and `dy`. When `Math.abs(dx) >= 10 && Math.abs(dx) > Math.abs(dy)`, swiping left calls `go(1)` and swiping right calls `go(-1)`.
- [x] T017 [US2] Edit `src/layouts/Deck.astro`:
  - Add `<ClientRouter />` (from `astro:transitions`) to `<head>`.
  - Put `transition:animate="none"` on `<html>`, `transition:animate={fade({ duration: '0.2s' })}` on `#slide`, and `transition:animate="none"` on `<footer>`.
  - Add `<script>import '../scripts/navigation.js';</script>` at the end of `<body>` (research R4).
- [x] T018 [US2] Run quickstart.md V4: three positions × five inputs. Also hold → from `/38` and confirm it stops at `/40` with no overlap. Fix `src/scripts/navigation.js` if anything fails (FR-013, FR-015, FR-016, SC-002).

**Checkpoint**: Keyboard and swipe navigation and the fade all work. Commit.

---

## Phase 5: User Story 3 - Links and URLs keep working (Priority: P2)

**Goal**: `/` → `/1`; `/<n>` with no trailing slash; the "NOT FOUND" page for unknown paths.

**Independent Test**: The quickstart.md V5 `curl` route checks (contracts/routes.md § Routes).

- [x] T019 [P] [US3] Add `redirects: { '/': '/1' }` to `astro.config.mjs` (dev-server parity, research R3).
- [x] T020 [P] [US3] Create `public/_redirects` containing the single rule `/  /1  302!` (FR-006).
- [x] T021 [P] [US3] Create `src/pages/404.astro`. It renders `<Deck><div><h1>NOT FOUND</h1><p>You just hit a route that doesn't exist... the sadness.</p></div></Deck>`, with no `index` or `total`, so there is no footer number and no navigation (FR-007; plan § Accepted differences).
- [x] T022 [US3] Run `yarn build`. Confirm `dist/404.html` and `dist/_redirects` exist. In `yarn develop`, confirm `/` lands on `/1`, and `/999` shows NOT FOUND.

**Checkpoint**: Routing works locally. Commit. Trailing-slash and production redirect behaviour are checked on the preview in T025.

---

## Phase 6: User Story 4 - Maintainer edits and deploys slides with less tooling (Priority: P2)

**Goal**: The same authoring workflow and scripts, with Netlify building from committed config.

**Independent Test**: quickstart.md V2 plus a green Netlify deploy preview.

- [x] T023 [US4] Run quickstart.md V2. Add a temporary `src/slides/11-persisting045.md` with two chunks separated by a blank line and `---`, plus one setext heading (`Title` followed directly by `---`). Confirm two slides appear right after the `11-persisting04` slide and the setext line renders as `<h2>`. Then delete the file (FR-002, FR-003).
- [x] T024 [US4] Run `yarn clean`, `yarn develop`, `yarn build`, `yarn serve` and `yarn format`. Confirm each works and that `yarn format` reformats `.astro` files. Make a trivial whitespace edit in `src/layouts/Deck.astro` and commit it to confirm the husky pre-commit hook (`.husky/pre-commit`) formats it (FR-022).
- [x] T025 [US4] *(dashboard checked 2026-10-26: Runtime not set, no Gatsby leftovers)* Before pushing, check the Netlify site in the dashboard:
  - **Site configuration → Build & deploy → Build plugins**: no Gatsby plugin, e.g. `@netlify/plugin-gatsby` or "Essential Gatsby".
  - **Build settings**: framework not pinned to Gatsby.

  If either is set, record it in the PR description and remove or reset it. A dashboard change is allowed only to remove Gatsby leftovers; all real config lives in `netlify.toml`.

  Then push the branch and open a PR so Netlify builds a deploy preview. Then run the quickstart.md V5 route `curl` checks against the preview, including `/12/`. If `/12/` returns 404, add a trailing-slash rule to `public/_redirects` per research R3, and confirm it doesn't loop (FR-017, SC-003).

**Checkpoint**: The deploy preview is green and the routes match contracts/routes.md.

---

## Phase 7: User Story 5 - Deck stays secure, old cache is retired, venue fallback is documented (Priority: P3)

**Goal**: Same or stricter headers, the old Gatsby worker removed, no new worker, and a local-build fallback.

**Independent Test**: quickstart.md V5 (headers and worker) and V6 (offline local run).

- [x] T026 [P] [US5] Create `public/_headers` per contracts/routes.md § Response headers:
  - `/*`: the exact CSP string, `Permissions-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy` (the T001 baseline value, default `same-origin`).
  - `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`.
  - `/sw.js`: `Cache-Control: no-cache` (FR-018, research R6).
- [x] T027 [P] [US5] Create `public/sw.js` as a kill-switch worker (research R7):
  - On `install`, `self.skipWaiting()`.
  - On `activate`, `event.waitUntil` of: delete all `caches.keys()`, then `self.registration.unregister()`, then `self.clients.matchAll({ type: 'window' })` and `client.navigate(client.url)` for each.

  Confirm no file under `src/` calls `navigator.serviceWorker.register` (FR-019, FR-020).
- [x] T028 [P] [US5] Add a "Presenting without network" section to `README.md`. It says to run `yarn install && yarn build` while online, and `yarn serve` at the venue, then open `http://localhost:8000/1` (FR-020).
- [x] T029 [US5] On the deploy preview, run the quickstart.md V5 header `curl` and compare it with the T001 baseline. Every header must be present and at least as strict. Then run quickstart.md V6 (`yarn build && yarn serve` with networking off) (SC-005).
- [x] T041 [US5] Pre-merge local test of worker retirement, on one origin, `http://localhost:8000` (FR-019, SC-006):
  1. `git worktree add ../ide-gatsby master`, then in that worktree run `yarn install && yarn build && yarn gatsby serve -p 8000`.
  2. In a fresh browser profile, open `http://localhost:8000/1`, navigate a few slides, and confirm DevTools → Application shows the Gatsby service worker active and Cache Storage filled.
  3. Stop the server. On the feature branch, run `yarn build && yarn serve` (same port).
  4. Reload `/1` in the same profile, a second time if needed. Confirm the Astro deck shows, no service worker is registered, Cache Storage is empty, and the console has no errors.
  5. If any check fails, fix `public/sw.js` and repeat. Remove the worktree when done: `git worktree remove ../ide-gatsby`.

**Checkpoint**: Security and fallback are verified on the preview, and worker retirement is verified locally (T041). Commit. Production worker retirement is re-checked after merge (T038).

---

## Phase 8: Polish & Cross-Cutting Concerns (Governance, FR-024)

**Purpose**: Make the docs describe the new stack, then the final gates.

*(T030, the constitution amendment, moved to Phase 0 and is done.)*

- [x] T031 Create ADR-007 "Astro static site generator" (supersedes ADR-001 and ADR-006) and ADR-008 "No offline worker; local-build venue fallback" (supersedes ADR-005), via `/architect-specify` with this spec as input. Then run `/architect-clarify`.
- [x] T032 Set the status of `.specify/memory/adr/ADR-001.md`, `ADR-005.md` and `ADR-006.md` to "Superseded by ADR-007/008". Add an "Implementation updated 2026-10" note to `ADR-002.md` (loader splits Markdown source) and `ADR-003.md` (vanilla-JS navigation + ClientRouter). Update `.specify/memory/adr/index.md`.
- [ ] T033 Regenerate `AD.md` and `.specify/architect/views/system/*.md` via `/architect-implement`.
- [x] T034 [P] Update `CLAUDE.md`:
  - commands (`yarn develop|build|clean|format|serve`)
  - Key Directories (`public/`, `src/scripts/`, `src/content.config.js`; remove `src/templates`, `src/components`)
  - Key Configuration Files (`astro.config.mjs`, `netlify.toml`, `public/_headers`)
  - Key Dependencies
  - Image Handling, Deployment (`dist/`), Troubleshooting and Slide Navigation sections
- [x] T035 [P] Update the rest of `README.md`: fix "`src/slides.md`" to `src/slides/`, describe the `---` splitting rule including the setext caveat, and mention Astro.
- [ ] T036 Run quickstart.md V7: `grep -i gatsby package.json` and the docs grep (expect no output outside superseded ADRs), `yarn audit --level high` (no high or critical), and confirm 9 or fewer declared dependencies (SC-004, SC-008).
- [ ] T037 Run a final `yarn format && yarn build`. Write the PR description in `specs/001-gatsby-to-astro-migration/` style, with: dependency justification for `astro` and `prettier-plugin-astro` (constitution §V), accepted differences from `review-notes.md` and plan.md, and the post-merge check list. End with the Claude Code attribution line.
- [ ] T038 After merge to `master`, run quickstart.md V5 "Worker retirement" in the T001 browser profile against production. Confirm the new deck shows, no service worker is registered, and Cache Storage is empty. Also confirm a fresh profile has no worker (SC-006).
- [ ] T039 After merge, run `/architect-analyze` to confirm the ADRs and AD.md are consistent. The postponed A2/E1 follow-ups are now moot.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (done)**: T030 and T040 are complete. Their commit precedes all migration work.
- **Setup (Phase 1)**: depends on Phase 0. T001 first, before any code change. T002 → T003–T006 [P] → T007.
- **Foundational (Phase 2)**: depends on Phase 1. T008 [P] with T009. T010 needs T008. T011 needs T009 and T010. T012 last. **Blocks all stories.**
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2. It edits `Deck.astro` after T010, but doesn't depend on US1.
- **US3 (Phase 5)**: depends on Phase 2 (T021 uses `Deck.astro`). Independent of US1 and US2.
- **US4 (Phase 6)**: depends on Phase 2. T025 (deploy preview) works best after US3 and US5 files exist, so their preview checks run in one pass.
- **US5 (Phase 7)**: T026–T028 depend only on Phase 1. T029 needs the preview from T025. T041 needs T027 and a Phase 2 build, and runs locally before merge.
- **Polish (Phase 8)**: T031–T035 can start any time after Phase 2. T036 and T037 come after all stories. T038 and T039 come after merge.

### User Story Dependencies

- **US1, US2 (P1)**: independent of each other. Both edit only their own files, apart from `Deck.astro`: US1 doesn't touch it, and US2 adds transitions and the script.
- **US3, US4 (P2)**: independent. US4's preview check (T025) also covers US3's production routing.
- **US5 (P3)**: independent files. Its verification shares the US4 deploy preview.

### Within Each User Story

- Create files, then build, then verify against quickstart.md, then commit at the checkpoint.

## Parallel Opportunities

- Phase 1: T003, T004, T005 and T006 (four separate config files).
- Phase 2: T008 alongside T009.
- After Phase 2: US1 review (T013–T015), US2 script (T016), US3 files (T019–T021) and US5 files (T026–T028) all touch different files.
- Phase 8: T034 and T035 in parallel, and T031–T033 run separately from code work.

## Parallel Example: after Phase 2

```bash
Task: "T016 [US2] Create src/scripts/navigation.js per contracts/navigation.md"
Task: "T020 [US3] Create public/_redirects with '/  /1  302!'"
Task: "T021 [US3] Create src/pages/404.astro"
Task: "T026 [US5] Create public/_headers per contracts/routes.md"
Task: "T027 [US5] Create public/sw.js kill-switch worker"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 + Phase 2 → `yarn build` green, deck renders.
2. Phase 3 (US1) → visual parity confirmed. **Stop and check.** This is the go/no-go point for the migration.
3. US2 is also P1, so finish it before any merge: a deck without navigation can't be presented.

### Incremental Delivery (single PR, staged commits)

1. Setup + Foundational → commit
2. US1 → commit
3. US2 → commit
4. US3 → commit
5. US5 files → commit
6. US4 preview + US5 verification → fixes committed
7. Governance docs → commit
8. Final gates → PR ready → merge → T038/T039

Nothing merges to `master` until all stories pass. `master` deploys to production (constitution §III).

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Commit only at checkpoints where `yarn build` passes. Never use `--no-verify` (constitution, Workflow §2).
- `review-notes.md` is the only new artifact in the spec dir. Baseline screenshots and headers stay in the scratchpad.
