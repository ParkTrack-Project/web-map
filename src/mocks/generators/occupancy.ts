// Симуляция исторической занятости с baseline-кривой по часу/дню недели.
// Для прошлого режима селектора времени.
import type { ZoneMapItem } from './zones';

export interface OccupancyItem {
  zone_id: number;
  at: string; // ISO 8601
  occupied: number;
  capacity: number;
  free_count: number;
  confidence: number;
}

// Кривая занятости 0..1 в зависимости от часа и выходных.
function baseline(hour: number, isWeekend: boolean): number {
  // Базовая ночная занятость
  if (hour < 6 || hour >= 23) return 0.3;
  if (isWeekend) {
    // Выходные: размытый дневной горб
    if (hour >= 11 && hour <= 19) return 0.55;
    return 0.4;
  }
  // Будни: пики 8-10 и 17-19
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) return 0.85;
  if (hour >= 11 && hour <= 16) return 0.7;
  return 0.5;
}

// Псевдо-гаусс через Box-Muller.
function gaussian(rnd: () => number, mean: number, std: number): number {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Детерминированный rng от zone_id + timestamp-bucket.
function rngFromKey(key: number): () => number {
  let s = key >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateOccupancyTimeseries(zones: ZoneMapItem[], at: Date): OccupancyItem[] {
  const hour = at.getUTCHours();
  const dow = at.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  const base = baseline(hour, isWeekend);
  const tsBucket = Math.floor(at.getTime() / (5 * 60_000)); // 5-минутные бакеты

  return zones.map((z) => {
    const rnd = rngFromKey(z.zone_id * 1009 + tsBucket);
    const noisy = clamp(base + gaussian(rnd, 0, 0.1), 0, 1);
    const occupied = Math.round(noisy * z.capacity);
    const confidence = hour < 6 ? 0.5 + rnd() * 0.2 : 0.7 + rnd() * 0.25;
    return {
      zone_id: z.zone_id,
      at: at.toISOString(),
      occupied,
      capacity: z.capacity,
      free_count: z.capacity - occupied,
      confidence: Math.round(confidence * 100) / 100,
    };
  });
}
