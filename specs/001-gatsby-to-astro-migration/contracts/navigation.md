# Contract: Presenter Input → Navigation

Client-side behaviour that the presenter relies on. Source of truth: [data-model.md § State transitions](../data-model.md#state-transitions-client).

| Input | Detection | Action |
|---|---|---|
| Next | `keydown` with `key` ∈ {`ArrowRight`, `Enter`, `" "`} | `/n+1` if `n < N` |
| Previous | `keydown` with `key` = `ArrowLeft` | `/n-1` if `n > 1` |
| Swipe left | `touchend` − `touchstart`: `dx ≤ −10px` and `|dx| > |dy|` | same as Next |
| Swipe right | `dx ≥ 10px` and `|dx| > |dy|` | same as Previous |

- Listeners are attached once per page load and survive client-side navigations.
- `n` and `N` are read from the DOM when each event fires, never cached.
- The transition is a 200 ms opacity cross-fade of `#slide`. The footer swaps without animation.
- Navigation uses client-side routing, so the URL updates to `/<n>`. Back and Forward walk through visited slides.
- No `preventDefault` is called on keys (same as the original).
