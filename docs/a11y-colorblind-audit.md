# A11Y colorblind audit (Phase 5 D-28)

Verify all 5 zone semantic states (red / yellow / light-green / dark-green / grey per ZONE-02) are distinguishable under color vision deficiencies.

## Setup

1. Open Chrome DevTools → ⋮ → More tools → Rendering
2. Scroll to «Emulate vision deficiencies»

## Test matrix

| Vision mode    | Expected outcome                                                        |
| -------------- | ----------------------------------------------------------------------- |
| None           | All 5 colors visually distinct                                          |
| Achromatopsia  | Distinguishable via free_count badge (Phase 2 D-02 redundant encoding)  |
| Protanopia     | Red/dark-green may merge → free_count badge differentiates              |
| Deuteranopia   | Similar to Protanopia → free_count badge differentiates                 |
| Tritanopia     | Yellow/green pair may shift → free_count badge differentiates           |
| Blurred vision | Color still distinguishable; badge readability tested at zoom_level=14+ |

## Test procedure

1. Open `/map` with viewport showing a mix of zone states (use MSW handler with `?count=50` if needed for variety)
2. For each vision mode in matrix:
   a. Activate emulation
   b. Take a screenshot of the visible map area
   c. Save as `phase-05-uat/colorblind-{mode}.png`
   d. Verify each of 5 states identifiable (color OR badge)
3. Pass: all 5 states identifiable in all modes via at least one channel (color or badge)

## Known mitigations

- Phase 2 D-02 redundant encoding: every zone has free_count badge (number) overlaid; even at full color blindness the digit reveals state.
- Phase 2 D-01 zone palette chosen to be colorblind-safe (verified by viz4all proportional dichromat simulation during research).

## Failures

(Filled by Plan 05-05 UAT.)
