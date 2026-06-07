// N-4: централизованный z-index стек. Раньше значения были разбросаны по
// файлам (z-20 в ZoneStateOverlay, z-30 в ModeTransitionOverlay, z-30 в
// FiltersFAB/TimeSelectorChip, z-40/50 в vaul Drawer). Один источник истины
// → нет risk'а пересечения.
//
// Tailwind utility-классы используются по-прежнему (z-20, z-30 etc.); этот
// модуль документирует семантику для разработчиков и для использования
// через `style={{ zIndex: Z_INDEX.modeTransitionOverlay }}` в инлайн-styles
// там где нужна динамика.
// Порядок слоёв ВНУТРИ карты (ymaps3). КРИТИЧНО: каждый наш оверлей —
// ОТДЕЛЬНЫЙ YMapLayer с этим zIndex, а НЕ маркер в дефолтном features-слое
// Яндекса. В дефолтном features-слое живёт встроенная парковка Яндекса
// («секторы»); маркер без своего слоя попадает в этот же слой и перекрывается
// парковкой. Свой слой с zIndex отсюда (> дефолтного features-слоя Яндекса
// ~1500) гарантированно кладёт оверлей ПОВЕРХ всей встроенной графики.
//
// Стек (снизу вверх): полигоны/линии зон (WebGL feature-слои) → бейджи →
// кружки групп → старт маршрута → конец маршрута (парковка назначения, самый
// верх). Единый источник истины: раньше числа были раскиданы инлайном по слоям.
export const MAP_Z = {
  zonePolygons: 1900, // standard-полигоны (feature-слой)
  zoneParallel: 1901, // parallel-полосы LineString (feature-слой)
  zoneBadges: 2000, // free_count pill-маркеры одиночных зон (слой ptk-badges)
  cluster: 2100, // кружки групп (слой ptk-clusters) — поверх парковки Яндекса
  routeStart: 2200, // точка начала маршрута (слой ptk-route-start)
  routeEnd: 2300, // точка конца / парковка назначения (слой ptk-route-end) — верх
} as const;

export const Z_INDEX = {
  zoneStateOverlay: 20, // empty/error overlay поверх карты
  modeTransitionOverlay: 30, // mode-switch skeleton (Phase 3 TIME-06)
  filtersFab: 30, // mobile FAB фильтры
  timeSelectorChip: 30, // mobile time selector chip (Plan 02 I-1)
  drawerOverlay: 40, // vaul Drawer.Overlay backdrop
  drawerContent: 50, // vaul Drawer.Content sheet
  // Phase 4 additions
  resultsPanel: 20, // desktop left-side ResultsPanel (D-18); same layer as zoneStateOverlay
  wtpCtaDesktop: 30, // desktop primary [Где припарковаться?] button overlay top-left (D-08, CO-01)
  wtpFabMobile: 20, // mobile FAB; ниже filtersFab/timeSelectorChip — D-50 collision-prevention
  fitToRouteButton: 25, // bottom-right map button (D-30); выше zoneStateOverlay но ниже modeTransitionOverlay
  deeplinkPopover: 60, // radix Popover content (D-32); выше drawerContent чтобы видно над открытым vaul
  preflightDialog: 60, // radix Dialog overlay+content (D-10); выше всех Drawer'ов
  bestVariantGlow: 15, // YMapFeature внутри карты (D-21); ниже UI overlays
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
