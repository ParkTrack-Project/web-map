# UAT flows checklist (D-37)

Manual flows to execute on every device in the UAT matrix (uat-matrix.md).
Tick each step that PASSES on the device. Note failures with screenshot/log reference.

## Pre-test setup

- Build deployed to staging.parktrack.live OR Vercel/Netlify preview URL with `VITE_API_MODE=mock`
- Build deployed second time with `VITE_API_MODE=real` for INTEG-04 verification (after Никита confirms endpoint availability)

## Flows (10 steps)

1. **Open `/map`** → карта рендерится; >=1 zone visible within 5s
2. **Pan + zoom** → новые zones подгружаются; debounce 400ms работает; no jank visible
3. **Apply filter «только свободные»** (FiltersFAB → toggle) → видимые zones уменьшились (число изменилось)
4. **Tap зону** → ZoneCard открывается (mobile bottom sheet snap [0.92] per Phase 4 CO-02)
5. **Switch time mode** → ModeTransitionOverlay появился; новые zones отрендерены for new mode
6. **Search «Невский»** → suggestions появились; выбрать → карта центрируется
7. **Tap MobileResultsButton («Найти парковки рядом»)** → pre-flight Drawer; разрешить геолокацию → results sheet с парковками
8. **Tap «Лучший вариант»** → ZoneCard; tap «Построить маршрут» → route polyline на карте
9. **Tap «В путь»** → deeplink menu (3 опции) → tap Я.Навигатор:
   - Если установлен: app открывается с маршрутом
   - Если НЕ установлен: 2.5s timer fallback → web Я.Карты в browser
10. **Refresh при `?from=...&route=N`** → state восстанавливается полностью (URL deeplink)

## D-38 VK / TG in-app browser specific

11. Открыть VK → отправить себе ссылку `https://staging.parktrack.live/map?sel=42` → tap → in-app browser открыл карту → flows 1-9 пройти
12. То же для Telegram

Pitfall 7: in-app browsers могут блокировать `yandexnavi://` → 2.5s fallback на web Я.Карты ДОЛЖЕН сработать. Document «known limitation» if hot critical bug found (escalate to v1.x hot-fix).

## Pass criteria

- All 10 flows pass on each of: iPhone iOS 17+ Safari, Android 14+ Chrome
- Flows 11-12 pass on VK + TG in-app browsers (with timer-fallback acceptable)
- No console.error during any flow
- No white screen / Map error boundary trigger
