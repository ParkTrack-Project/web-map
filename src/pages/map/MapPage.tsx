// Plan 03 wave 3: MapPage переработан с DesktopLayout/MobileLayout split.
// Plan 02 wiring `<ZoneCard/>`/`<MobileZoneCard/>` сохранён через вложенность
// в Layout-компонентах (а не в MapPage напрямую).
// CSS @media gate (`hidden lg:flex` + `flex lg:hidden`) разделяет; никогда оба
// не видны одновременно.
//
// Phase 3 Plan 04: добавлен <TimeModeLiveRegion/> для A11Y-03 — один на страницу.
//
// Phase 5 polish (RESP-05) complete: h-screen → h-dvh в обоих layout'ах,
// useVisualViewportHeight интегрирован во все 4 vaul mobile sheet'а +
// MobileSearchBar для keyboard-aware sizing.
import { DesktopLayout } from './ui/DesktopLayout';
import { MobileLayout } from './ui/MobileLayout';
import { TimeModeLiveRegion } from '@/widgets/time-selector';
import { ResultsMapSync } from '@/widgets/results-panel';

export function MapPage() {
  return (
    <>
      <DesktopLayout />
      <MobileLayout />
      <ResultsMapSync />
      {/* A11Y-03 / D-17 — один live region на страницу */}
      <TimeModeLiveRegion />
    </>
  );
}
