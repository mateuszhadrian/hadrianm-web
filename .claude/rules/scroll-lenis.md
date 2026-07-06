---
paths:
  - "src/scripts/smooth-scroll.ts"
  - "src/layouts/BaseLayout.astro"
---

# Smooth scroll (Lenis) — reguły

- Stałe desktop (`WHEEL_LERP = 0.05` — fix na skokowe rolki z zapadkami)
  i touch (`syncTouch`, `SYNC_TOUCH_LERP`, `TOUCH_INERTIA_EXPONENT`) są
  rozdzielone CELOWO. Scalenie ich wywołało regresję (commit `0640aa1`,
  naprawa `99ef97a`). NIE ujednolicaj.
- Detekcja dotyku: `navigator.maxTouchPoints > 0` — NIE media queries
  `hover`/`pointer` (laptopy z dotykiem kłamią).
- Lenis ładowany tylko przy `prefers-reduced-motion: no-preference`
  (bramka w `BaseLayout`); instancja wystawiona jako `window.__lenis`
  (używa jej navbar do `scrollTo`).
- Każda zmiana stałych = test na fizycznym macOS (gładkie kółko), myszy
  z zapadkami i telefonie (wybieg po machnięciu).
