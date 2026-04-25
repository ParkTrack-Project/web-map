// N-4: централизованный z-index стек. Раньше значения были разбросаны по
// файлам (z-20 в ZoneStateOverlay, z-30 в ModeTransitionOverlay, z-30 в
// FiltersFAB/TimeSelectorChip, z-40/50 в vaul Drawer). Один источник истины
// → нет risk'а пересечения.
//
// Tailwind utility-классы используются по-прежнему (z-20, z-30 etc.); этот
// модуль документирует семантику для разработчиков и для использования
// через `style={{ zIndex: Z_INDEX.modeTransitionOverlay }}` в инлайн-styles
// там где нужна динамика.
export const Z_INDEX = {
  zoneStateOverlay: 20, // empty/error overlay поверх карты
  modeTransitionOverlay: 30, // mode-switch skeleton (Phase 3 TIME-06)
  filtersFab: 30, // mobile FAB фильтры
  timeSelectorChip: 30, // mobile time selector chip (Plan 02 I-1)
  drawerOverlay: 40, // vaul Drawer.Overlay backdrop
  drawerContent: 50, // vaul Drawer.Content sheet
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
