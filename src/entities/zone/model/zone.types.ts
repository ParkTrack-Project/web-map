// Минимальный GeoJSON-Polygon (ровно тот вид, что отдаёт API). Полноценный пакет
// @types/geojson пока не нужен — добавим, если появится больше геометрических типов.
export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

// Соответствует docs-website/docs/api/parking_zones.mdx (view=map).
export interface ZoneMapItem {
  id: string;
  geometry: PolygonGeometry;
  free_count: number;
  capacity: number;
  confidence: number;
  is_active: boolean;
  zone_type: 'parallel' | 'standard';
  pay: number;
}

// Phase 3 forward-compat: режим времени включён в queryKey и cache-key стиля
// заранее, чтобы Phase 3 (селектор времени) был аддитивным изменением.
export type TimeMode =
  | { kind: 'now' }
  | { kind: 'past'; at: string }
  | { kind: 'future'; at: string };
