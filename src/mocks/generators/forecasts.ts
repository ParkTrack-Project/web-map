// Прогнозы занятости. Аналогичны occupancy, но шире доверительный интервал
// и форма результата отличается (forecasted_free_count + confidence).
import type { ZoneMapItem } from './zones';

export interface ForecastItem {
  zone_id: number;
  at: string;
  forecasted_free_count: number;
  capacity: number;
  confidence: number;
}

function baseline(hour: number, isWeekend: boolean): number {
  if (hour < 6 || hour >= 23) return 0.3;
  if (isWeekend) {
    if (hour >= 11 && hour <= 19) return 0.55;
    return 0.4;
  }
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) return 0.85;
  if (hour >= 11 && hour <= 16) return 0.7;
  return 0.5;
}

function gaussian(rnd: () => number, mean: number, std: number): number {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

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

export function generateForecasts(zones: ZoneMapItem[], at: Date): ForecastItem[] {
  const hour = at.getUTCHours();
  const dow = at.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  const base = baseline(hour, isWeekend);
  const tsBucket = Math.floor(at.getTime() / (15 * 60_000));

  // Чем дальше прогноз — тем шире std и ниже confidence.
  const horizonHours = Math.max(0, (at.getTime() - Date.now()) / 3_600_000);
  const noiseStd = 0.15 + Math.min(horizonHours * 0.02, 0.2);
  const baseConfidence = clamp(0.85 - horizonHours * 0.04, 0.4, 0.85);

  return zones.map((z) => {
    const rnd = rngFromKey(z.zone_id * 1013 + tsBucket);
    const noisy = clamp(base + gaussian(rnd, 0, noiseStd), 0, 1);
    const occupied = Math.round(noisy * z.capacity);
    return {
      zone_id: z.zone_id,
      at: at.toISOString(),
      forecasted_free_count: z.capacity - occupied,
      capacity: z.capacity,
      confidence: Math.round((baseConfidence + (rnd() - 0.5) * 0.1) * 100) / 100,
    };
  });
}
