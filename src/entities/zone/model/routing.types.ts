// Phase 4 / D-14..D-16 / RANK-01/02 / ROUTE-01/02:
// Типы для Routing API per docs-website/docs/api/routing.mdx §8.4-8.7.
// Server-side ranking — фронт НЕ пересчитывает score (D-14, RANK-02).
import type { PolygonGeometry, LocationType } from './zone.types';

/** §8.4 RouteCandidate — кандидат на парковку, рассчитанный сервером. */
export interface RouteCandidate {
  zone_id: number;
  camera_id: number | null;
  geometry: PolygonGeometry;
  zone_type: 'parallel' | 'standard';
  location_type: LocationType | null;
  is_accessible: boolean | null;
  pay: number;
  capacity: number;
  current_occupied: number;
  current_free_count: number;
  current_confidence: number;
  // Forecast — null когда use_forecast=false (D-41).
  predicted_for_arrival: string | null; // ISO 8601
  predicted_occupied: number | null;
  predicted_free_count: number | null;
  probability_free_space: number | null;
  forecast_confidence: number | null;
  // Distance/duration: from_origin обязательны, to_destination — null в mode=find_parking.
  distance_from_origin_meters: number;
  duration_from_origin_seconds: number;
  distance_to_destination_meters: number | null;
  duration_to_destination_seconds: number | null;
  score: number; // 0..1
  rank: number; // 1-based position
}

/** §8.5 Route — полный объект построенного маршрута. */
export interface Route {
  route_id: number;
  user_id: number;
  mode: 'find_parking' | 'route_to_destination';
  provider: string; // 'yandex' | 'internal' | 'external'
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number } | null;
  selected_zone_id: number;
  selected_candidate: RouteCandidate;
  eta_seconds: number;
  arrival_time: string; // ISO 8601
  polyline: string | null; // null в MVP (D-29)
  deeplink_url: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'replaced';
  created_at: string;
  updated_at: string;
}

/** §8.6 POST /routing/search request body. mode дискриминирует — destination обязателен при route_to_destination (D-15). */
export interface RoutingSearchBody {
  mode: 'find_parking' | 'route_to_destination';
  origin: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  max_pay?: number;
  min_free_count?: number;
  min_confidence?: number;
  max_distance_to_destination_meters?: number;
  max_duration_from_origin_seconds?: number;
  include_accessible?: boolean;
  limit?: number;
  use_forecast?: boolean;
  provider?: string;
}

/** §8.6 POST /routing/search response. */
export interface RoutingSearchResponse {
  mode: 'find_parking' | 'route_to_destination';
  provider: string;
  generated_at: string;
  candidates: RouteCandidate[];
  selected_zone_id: number | null;
  total_candidates: number;
}

/** §8.7 POST /routing/new request body — те же поля что search + опционально selected_zone_id. */
export interface RoutingNewBody extends RoutingSearchBody {
  selected_zone_id?: number;
}
