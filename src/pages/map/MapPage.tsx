// Plan 03 wave 3: MapPage переработан с DesktopLayout/MobileLayout split.
// Plan 02 wiring `<ZoneCard/>`/`<MobileZoneCard/>` сохранён через вложенность
// в Layout-компонентах (а не в MapPage напрямую).
// CSS @media gate (`hidden lg:flex` + `flex lg:hidden`) разделяет; никогда оба
// не видны одновременно.
//
// Phase 5 polish (RESP-05): h-screen в Layout'ах → dvh + visualViewport API.
// Сейчас dvh уже используется в MobileFiltersDrawer и MobileZoneCard, но базовый
// h-screen в DesktopLayout/MobileLayout остаётся.
import { DesktopLayout } from './ui/DesktopLayout';
import { MobileLayout } from './ui/MobileLayout';

export function MapPage() {
  return (
    <>
      <DesktopLayout />
      <MobileLayout />
    </>
  );
}
