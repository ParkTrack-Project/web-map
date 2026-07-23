import { describe, it, expect } from 'vitest';
import {
  ROUTING_SEARCH_DEBOUNCE_MS,
  DEEPLINK_FALLBACK_MS,
  GEOLOCATION_TIMEOUT_MS,
  RESULTS_PANEL_WIDTH_PX,
  RESULTS_LIST_ITEM_HEIGHT_PX,
  LIVE_DATA_REFETCH_MS,
  SUGGEST_MIN_QUERY_LENGTH,
  Z_INDEX,
  MAP_Z,
} from '@/shared/config';

describe('Phase 4 constants', () => {
  it('ROUTING_SEARCH_DEBOUNCE_MS = 300 (D-26 / SEARCH-01)', () => {
    expect(ROUTING_SEARCH_DEBOUNCE_MS).toBe(300);
  });
  it('DEEPLINK_FALLBACK_MS = 2500 (D-33 / ROUTE-07)', () => {
    expect(DEEPLINK_FALLBACK_MS).toBe(2500);
  });
  it('GEOLOCATION_TIMEOUT_MS = 10000 (D-12)', () => {
    expect(GEOLOCATION_TIMEOUT_MS).toBe(10_000);
  });
  it('RESULTS_PANEL_WIDTH_PX = 400 (D-18)', () => {
    expect(RESULTS_PANEL_WIDTH_PX).toBe(400);
  });
  it('RESULTS_LIST_ITEM_HEIGHT_PX fits the parking metrics', () => {
    expect(RESULTS_LIST_ITEM_HEIGHT_PX).toBe(140);
  });
  it('refreshes live occupancy within 15–30 seconds', () => {
    expect(LIVE_DATA_REFETCH_MS).toBeGreaterThanOrEqual(15_000);
    expect(LIVE_DATA_REFETCH_MS).toBeLessThanOrEqual(30_000);
  });
  it('SUGGEST_MIN_QUERY_LENGTH = 2 (Pitfall 5)', () => {
    expect(SUGGEST_MIN_QUERY_LENGTH).toBe(2);
  });
  it('Z_INDEX.resultsPanel ниже modeTransitionOverlay (overlay не перекрывается)', () => {
    expect(Z_INDEX.resultsPanel).toBeLessThan(Z_INDEX.modeTransitionOverlay);
  });

  it('кнопка аккаунта находится под карточками и панелями карты', () => {
    expect(Z_INDEX.accountTrigger).toBeLessThan(Z_INDEX.resultsPanel);
    expect(Z_INDEX.accountTrigger).toBeLessThan(Z_INDEX.drawerContent);
  });
  it('Z_INDEX.deeplinkPopover выше drawerContent (popover видно над vaul)', () => {
    expect(Z_INDEX.deeplinkPopover).toBeGreaterThan(Z_INDEX.drawerContent);
  });
  it('Z_INDEX.preflightDialog выше drawerContent', () => {
    expect(Z_INDEX.preflightDialog).toBeGreaterThan(Z_INDEX.drawerContent);
  });
  it('MAP_Z.cluster выше бейджей и полигонов (кружки групп — верхний инфо-слой)', () => {
    expect(MAP_Z.cluster).toBeGreaterThan(MAP_Z.zoneBadges);
    expect(MAP_Z.cluster).toBeGreaterThan(MAP_Z.zonePolygons);
    expect(MAP_Z.cluster).toBeGreaterThan(MAP_Z.zoneParallel);
  });
  it('MAP_Z.routeStart/routeEnd выше кружков групп (точки маршрута поверх кластеров)', () => {
    expect(MAP_Z.routeLine).toBeGreaterThan(MAP_Z.cluster);
    expect(MAP_Z.routeStart).toBeGreaterThan(MAP_Z.routeLine);
    expect(MAP_Z.routeStart).toBeGreaterThan(MAP_Z.cluster);
    expect(MAP_Z.routeEnd).toBeGreaterThan(MAP_Z.cluster);
  });
  it('MAP_Z.routeEnd — самый верхний слой (точка назначения поверх старта)', () => {
    expect(MAP_Z.routeEnd).toBeGreaterThan(MAP_Z.routeStart);
  });
});
