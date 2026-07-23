export const MAP_Z = {
  mapGestures: 1800, // прозрачная интерактивная подложка для drag по пустой карте
  zonePolygons: 1900, // standard-полигоны (feature-слой)
  zoneParallel: 1901, // parallel-полосы LineString (feature-слой)
  zoneBadges: 2000, // free_count pill-маркеры одиночных зон (слой ptk-badges)
  cluster: 2100, // кружки групп (слой ptk-clusters) — поверх парковки Яндекса
  routeLine: 2150, // линия построенного маршрута между origin и парковкой
  routeStart: 2200, // точка начала маршрута (слой ptk-route-start)
  routeEnd: 2300, // точка конца / парковка назначения (слой ptk-route-end) — верх
} as const;

export const Z_INDEX = {
  accountTrigger: 10, // кнопка аккаунта ниже всех карточек и map-overlay панелей
  zoneStateOverlay: 20, // empty/error overlay поверх карты
  modeTransitionOverlay: 30,
  filtersFab: 30, // mobile FAB фильтры
  timeSelectorChip: 30,
  drawerOverlay: 40, // vaul Drawer.Overlay backdrop
  drawerContent: 50,
  resultsPanel: 20,
  wtpCtaDesktop: 30,
  wtpFabMobile: 20,
  fitToRouteButton: 25,
  deeplinkPopover: 60,
  preflightDialog: 60,
  bestVariantGlow: 15,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
