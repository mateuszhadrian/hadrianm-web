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
- Guard pinch/zoom (`multiTouch`/`isZoomed` + opcja `prevent` w gałęzi
  touch) to NAPRAWIONY BUG (wystrzał scrolla po pinchu; analiza §2.1
  w `docs/first-bigger-improvement-refactor-analysis.md`) — NIE usuwać
  przy refaktorach. Lenis 1.3.x czyta tylko `targetTouches[0]`, więc
  pinch generuje szarpane delty, a `touchInertiaExponent` je potęguje.
  NIE zastępować `lenis.stop()` — w stanie stopped Lenis nadal robi
  `preventDefault` i zablokowałby natywne panowanie po zoomie; `prevent`
  ignoruje zdarzenie bez `preventDefault`.
- Handler `pageshow` z `e.persisted` (`lenis.resize()` +
  `ScrollTrigger.refresh()`) to NAPRAWIONY BUG powrotów przez bfcache
  (`history.back()` z podstron, wzorzec `a[data-back]`): stronę
  przywróconą z zamrożenia omijają resize'y, a pasek Safari zmienia
  w międzyczasie wysokość viewportu — bez przeliczenia dno strony/stopka
  są „przesunięte o pasek" na iOS. NIE usuwać; weryfikacja tylko na
  fizycznym iPhonie (emulacja nie odtwarza bfcache ani paska).
- Każda zmiana stałych = test na fizycznym macOS (gładkie kółko), myszy
  z zapadkami i telefonie (wybieg po machnięciu).
