export type {
  ZoneMapItem,
  Zone,
  TimeMode,
  PolygonGeometry,
  LocationType,
  ConfidenceLevel,
} from './model/zone.types';
export { fetchZones, fetchZoneById } from './api/zone.api';
export { useZonesQuery, useZoneByIdQuery } from './queries/zone.queries';
export { useParkingAddress } from './queries/parking-address.queries';
export { ParkingAddress } from './ui/ParkingAddress';
export { timeModeAdapter } from './model/time-mode-adapter';
export type { TimeModeRequest } from './model/time-mode-adapter';
export { TimeModeUnavailableError } from './model/time-mode-error';

// Phase 4 routing layer
export type {
  RouteCandidate,
  Route,
  RoutingSearchBody,
  RoutingSearchResponse,
  RoutingNewBody,
} from './model/routing.types';
export { searchRouting, createRoute, getRouteById } from './api/routing.api';
export {
  useRoutingSearch,
  useRouteByIdQuery,
  useCreateRouteMutation,
} from './queries/routing.queries';
