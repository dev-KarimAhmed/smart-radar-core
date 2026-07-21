# Language-aware ad slider direction

## Goal

Make the automatic ad stream and manual navigation in `src/components/dashboard/ad-stage.tsx` follow the active dashboard language.

## Behavior

- Arabic (`ar`): advertisements move visually from right to left.
- English (`en`): advertisements move visually from left to right.
- Previous and next controls move consistently with the active language.
- Pausing, looping, swipe metrics, favorites, and ad takeover behavior remain unchanged.

## Design

Keep the scroll track's internal `dir="ltr"` so `scrollLeft` has consistent cross-browser semantics. Derive a numeric movement sign from `isArabic`, then apply it to automatic scrolling and manual navigation. When automatic movement reaches either loop boundary, normalize the scroll position to the equivalent point in the duplicated ad sequence to preserve the seamless loop.

Direction calculations should be isolated in small pure helpers where practical so both language mappings can be tested without relying on browser-specific animation timing.

## Verification

- Add focused tests proving the Arabic and English movement signs are opposites and that previous/next navigation respects them.
- Run the focused test first and observe it fail before implementation.
- Run the focused test after implementation, followed by the relevant project validation commands.

## Scope

Only slider direction behavior in `ad-stage.tsx` and its focused tests are in scope. No visual redesign or unrelated refactor is included.
