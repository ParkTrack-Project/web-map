# A11Y manual keyboard walkthrough (Phase 5 D-27)

Manual test scenario for full keyboard navigation. Run on every Phase 5 verification + every regression bug fix touching focus order.

## Setup

- Browser: Chrome stable
- Window: desktop viewport (≥1024px) for first pass; iPhone 13 emulation for second pass
- Disable mouse temporarily (alternative: use only Tab/Shift+Tab/Enter/Space/Esc/Arrow keys)

## Walkthrough steps

1. Tab from URL bar → first focus lands on TimeSelectorPopover trigger button (top-4 left-4 cluster); visible focus ring present
2. Tab → WTPCTAButton («Где припарковаться?») receives focus; press Enter → pre-flight modal opens
3. Inside pre-flight: Tab to «Разрешить геолокацию» button; Esc closes modal, focus returns to WTPCTAButton (focus restoration)
4. Tab → SearchBar input; type «Невский» → autosuggest list appears; ArrowDown navigates suggestions; Enter selects
5. Tab → DesktopFiltersPopover trigger; Enter → popover opens; Tab cycles through 7 filters (chip-toggle, sliders, location-type checkbox group); Esc closes
6. (Mouse-only) Click a zone on map → ZoneCard side panel opens; Esc closes (focus returns to map area or last focused element)
7. Tab → ResultsPanel item (when ?from set); Enter or Space selects zone + opens card
8. Tab → «Построить маршрут» in ZoneCard; Enter → mutation runs, RoutePreviewLayer renders; Tab → «В путь» button; Enter → deeplink menu opens
9. Tab through deeplink menu options (3 items: Я.Навигатор / Я.Карты web / Google Maps); Enter selects; deeplink launches
10. (Mobile pass) Open MobileResultsButton bottom-center chip via Enter when focused; vaul Drawer opens; Tab cycles within drawer (focus trap); Esc closes drawer

## Pass criteria

- All steps completable without mouse
- Focus ring visible at every step (no «invisible focus»)
- Esc always closes overlays without exiting the app
- Tab/Shift+Tab order matches visual top-to-bottom + left-to-right reading order

## Known limitations

- Map canvas is intentionally NOT keyboard-accessible (Phase 2 D-17 — keyboard users navigate via filter/list/card; map is purely visual). This matches WCAG SC 2.1.1 «Keyboard» exemption for primary visual content.
- Yandex zoom controls (+/-) are within map canvas — also not in Tab order.
