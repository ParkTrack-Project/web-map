// MAP-08: мемоизация стиля зоны по 5-частному ключу. mode входит в ключ ради
// Phase 3 forward-compat (now/past/future могут давать разный визуальный язык).
//
// Phase 1 — это STUB: всем зонам отдаём нейтрально-серый. Phase 2 (ZONE-01..07)
// заменит на семантическую раскраску по free_count/confidence/is_active.
type StyleKey = {
  zoneId: string;
  free_count: number;
  confidence: number;
  is_active: boolean;
  mode: 'now' | 'past' | 'future';
};

export type ZoneStyle = { fill: string; stroke: string; strokeWidth: number };

const cache = new Map<string, ZoneStyle>();

function keyOf(k: StyleKey): string {
  return `${k.zoneId}|${k.free_count}|${k.confidence}|${k.is_active}|${k.mode}`;
}

export function computeZoneStyle(k: StyleKey): ZoneStyle {
  const key = keyOf(k);
  const hit = cache.get(key);
  if (hit) return hit;
  const style: ZoneStyle = { fill: '#9ca3af55', stroke: '#4b5563', strokeWidth: 1 };
  cache.set(key, style);
  return style;
}
