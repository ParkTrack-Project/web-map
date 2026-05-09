// MAP-08 + ZONE-02 + D-01/D-08: семантическая раскраска зон.
//
// Ключ кеша: (zoneId, free_count, confidence, is_active, mode, selected) —
// все 6 параметров, которые могут изменить визуал. Memoized — без аллокации
// стилей per render (PITFALLS #2 в RESEARCH.md, MAP-08).
//
// Phase 1 был STUB (нейтрально-серый). Phase 2 Plan 01 Task 2 включает
// семантику D-01 + selected: 3px stroke (D-08). Outer-glow рисуется как
// дублирующий feature в ZoneLayer (Plan 02 wires selected по-настоящему,
// сейчас Plan 01 ставит selected=false для всех — см. ZoneLayer.tsx).
import { zonePalette, CONFIDENCE_THRESHOLD } from '@/shared/config/zone-palette';

export type StyleKey = {
  zoneId: number;
  free_count: number;
  confidence: number;
  is_active: boolean;
  mode: 'now' | 'past' | 'future';
  selected: boolean;
};

export type ZoneStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
};

const cache = new Map<string, ZoneStyle>();

function keyOf(k: StyleKey): string {
  return `${k.zoneId}|${k.free_count}|${k.confidence}|${k.is_active}|${k.mode}|${k.selected}`;
}

function pickPalette(k: StyleKey): { fill: string; stroke: string } {
  // D-01 правила в строгом порядке (раннее правило важнее позднего):
  if (!k.is_active) return zonePalette.inactive;
  if (k.free_count === 0) return zonePalette.full;
  if (k.free_count === 1) return zonePalette.one;
  if (k.confidence >= CONFIDENCE_THRESHOLD) return zonePalette.freeHigh;
  return zonePalette.freeLow;
}

export function computeZoneStyle(k: StyleKey): ZoneStyle {
  const key = keyOf(k);
  const hit = cache.get(key);
  if (hit) return hit;
  const base = pickPalette(k);
  const style: ZoneStyle = {
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: k.selected ? 3 : 1, // D-08
  };
  cache.set(key, style);
  return style;
}

// Конвертация внутреннего ZoneStyle в формат ymaps3 DrawingStyle.
// ymaps3 ожидает stroke как массив StrokeStyle (с поддержкой палитры по zoom),
// а наш внутренний формат — плоский { stroke, strokeWidth } для удобства тестов
// и Phase 5 swap на UI-kit Миши. Граничный конвертер изолирует это различие.
//
// Мемоизирован отдельным кешем по reference на ZoneStyle: т.к. computeZoneStyle
// уже отдаёт stable reference per-key, toDrawingStyle тоже будет stable.
const drawingCache = new WeakMap<
  ZoneStyle,
  { fill: string; stroke: { color: string; width: number }[] }
>();

export function toDrawingStyle(s: ZoneStyle): {
  fill: string;
  stroke: { color: string; width: number }[];
} {
  const hit = drawingCache.get(s);
  if (hit) return hit;
  const out = {
    fill: s.fill,
    stroke: [{ color: s.stroke, width: s.strokeWidth }],
  };
  drawingCache.set(s, out);
  return out;
}
