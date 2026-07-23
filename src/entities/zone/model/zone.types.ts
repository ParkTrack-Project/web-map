// Минимальный GeoJSON-Polygon (ровно тот вид, что отдаёт API + MSW-генератор).
// Полноценный пакет @types/geojson пока не нужен — добавим, если появится больше
// геометрических типов.
export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export type LocationType = 'street' | 'yard' | 'open_lot' | 'underground' | 'multilevel';
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high';

export interface ZoneMapItem {
  zone_id: number;
  zone_type: 'parallel' | 'standard';
  capacity: number;
  occupied: number;
  free_count: number;
  confidence: number;
  confidence_level: ConfidenceLevel;
  pay: number;
  geometry: PolygonGeometry;
  location_type: LocationType;
  is_private: boolean;
  is_accessible: boolean;
  occupancy_updated_at: string;
  is_active: boolean;
}

export interface Zone extends ZoneMapItem {
  camera_id: number;
  image_polygon: number[][];
  partner_id: number | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export type TimeMode =
  | { kind: 'now' }
  | { kind: 'past'; at: string }
  | { kind: 'future'; at: string };
