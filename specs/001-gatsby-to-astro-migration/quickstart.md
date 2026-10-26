# Quickstart: Validating the Gatsby → Astro Migration

This is a run guide for proving the feature works end to end. Behaviour definitions live in [contracts/](contracts/) and [data-model.md](data-model.md); this file says how to check them.

## Prerequisites

- Node 22 and Yarn 1 (`.tool-versions`), on the `001-gatsby-to-astro-migration` branch.
- Desktop Chrome or Firefox with device emulation (375×812), plus one real touch device or emulation for swipe.
- A browser profile that has visited the **current production** deck, so it holds the Gatsby service worker (for V5). Do this before merging.

## V0. Baseline (before any code change)

1. Open production `/1` … `/40` at 1920×1080 and at 375×812. Keep the tabs open, or save screenshots, for side-by-side review.
2. `curl -sI https://<production>/1 > baseline-headers.txt`. Don't commit it (scratch only).

## V1. Build and dev

```bash
yarn install
yarn build        # must pass: constitution §III
yarn develop      # http://localhost:8000
```

Expected: the build lists 40 slide pages plus 404. `dist/` contains `1.html` … `40.html`, `404.html`, `_headers`, `_redirects`, `sw.js`.

## V2. Slide pipeline (User Story 4)

1. Add a temporary `src/slides/11-persisting045.md` with frontmatter, two paragraphs separated by a blank line plus `---`, and a setext heading (`Title` on one line, `---` directly under it).
2. `yarn develop`. Expected: two new slides appear right after the `11-persisting04` slide. The setext line renders as an `<h2>` and does not split. Later slide numbers shift by 2.
3. Delete the temporary file.

## V3. Visual parity (User Story 1, FR-014, SC-001)

Using `yarn build && yarn serve` (or the deploy preview), compare every slide against the V0 baseline at both sizes. That's 80 comparisons. Pass bar: no difference a viewer would notice. Pay particular attention to:
- slides `/3`, `/9` and `/39` (images): position, size, centring
- the footer: colour, logo, text and number alignment
- the mobile breakpoint (font size)
- blockquote and list indentation

Record any accepted differences for the PR description.

## V4. Navigation (User Story 2, [contracts/navigation.md](contracts/navigation.md), SC-002)

On `/1`, `/20` and `/40`: press →, Enter and Space; press ←; swipe left and right (in emulation or on a device).

Expected:
- URL and slide change per the contract, with no movement past `/1` or `/40`.
- A ~200 ms fade on the slide; the footer number updates without fading.
- Holding → for about 2 s from `/38` stops at `/40` with no overlapping slides.

## V5. URLs, headers, worker retirement (User Stories 3 and 5, [contracts/routes.md](contracts/routes.md))

Push the branch and open the Netlify **deploy preview**.

```bash
P=https://deploy-preview-<n>--hardcore-galileo-55838f.netlify.app
curl -sI $P/ | grep -iE '^(HTTP|location)'         # 302 → /1
curl -sI $P/12 | head -1                            # 200
curl -sI $P/12/ | grep -iE '^(HTTP|location)'       # 200, or 301 → /12
curl -sI $P/999 | head -1                           # 404
curl -sI $P/1 | grep -iE 'content-security|permissions-policy|x-frame|x-content-type|referrer'
```

Compare the last command's output with `baseline-headers.txt`. Each header must be present and at least as strict.

**Worker retirement**: do this on **production right after merge**, because the old worker is scoped to the production origin, not the preview. In the V0 browser profile:
1. Open `/1`, then reload once if needed.
2. Expected: the new deck shows. DevTools → Application → Service Workers shows nothing registered, and Cache Storage is empty.
3. A fresh profile also shows no worker.

## V6. Venue fallback (User Story 5, scenario 4)

```bash
yarn build && yarn serve    # then turn off networking
```

Expected: `http://localhost:8000/1` … `/40` load and navigate, with no network.

## V7. Docs and dependencies (SC-004, SC-008)

```bash
grep -i gatsby package.json                                                      # no output
grep -ril gatsby .specify/memory/constitution.md AD.md CLAUDE.md README.md        # no output
yarn audit --level high                                                           # no high/critical
```

Expected: `package.json` lists 9 or fewer dependencies. Superseded ADRs (001, 005, 006) still mention Gatsby; that's allowed as history.
