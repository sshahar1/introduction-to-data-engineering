# Contract: Public URLs & HTTP Behaviour

The deck's external interface is its URL space and its response headers. These must stay compatible with links that are already shared.

## Routes

| Request | Response | Spec |
|---|---|---|
| `GET /` | `302` → `/1` (Netlify `_redirects`, forced) | FR-006 |
| `GET /<n>`, 1 ≤ n ≤ total | `200`, slide *n* HTML | FR-005 |
| `GET /<n>/` | `200` slide *n*, or `301` → `/<n>` (**verify**, research R3) | Edge case |
| `GET /<n>`, n > total, or any other unknown path | `404`, "NOT FOUND" page | FR-007 |
| `GET /sw.js` | `200`, kill-switch worker, `Cache-Control: no-cache` | FR-019 |
| `GET /_astro/*` | `200`, hashed asset, long-lived immutable cache | — |

No route may carry a trailing slash in links the site itself generates.

## Response headers (every route, `/*`)

Baseline: capture `curl -sI https://<production>/1` **before** cutover. The migrated deck must send each header below, with a value at least as strict as the baseline (FR-018, SC-005).

| Header | Required value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `same-origin` (or match the baseline if it differs) |

## Page document contract (every slide page)

| Element | Requirement |
|---|---|
| `<title>` | `Tikal Knowledge ™ 2020 — Sigal Shaharabani` |
| `<meta name="viewport">` | `width=device-width, initial-scale=1` (Gatsby default; needed for the mobile layout) |
| `#slide` | `data-index="<n>"`, `data-total="<N>"`; contains `.slide-content` with the rendered slide |
| `<footer>` | logo `img.footer__logo` (alt "Tikal"), title text, slide number *n* |
| Service worker | No `navigator.serviceWorker.register` call anywhere in the output |
