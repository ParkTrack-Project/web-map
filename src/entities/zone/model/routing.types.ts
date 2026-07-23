import type { PolygonGeometry, LocationType } from './zone.types';

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
  polyline: string | null;
  deeplink_url: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'replaced';
  created_at: string;
  updated_at: string;
}

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

export interface RoutingSearchResponse {
  mode: 'find_parking' | 'route_to_destination';
  provider: string;
  generated_at: string;
  candidates: RouteCandidate[];
  selected_zone_id: number | null;
  total_candidates: number;
}

export interface RoutingNewBody extends RoutingSearchBody {
  selected_zone_id?: number;
}
