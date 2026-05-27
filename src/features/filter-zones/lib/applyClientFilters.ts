import type { ZoneMapItem } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';

function getFreeCount(zone: ZoneMapItem): number {
  const raw =
    (zone as unknown as Record<string, unknown>)['free_count'] ??
    (zone as unknown as Record<string, unknown>)['predicted_free_count'] ??
    (zone as unknown as Record<string, unknown>)['forecasted_free_count'] ??
    (zone as unknown as Record<string, unknown>)['current_free_count'];

  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

export function applyClientFilters(zones: ZoneMapItem[], f: ZoneFilters): ZoneMapItem[] {
  const minFreeCount = Math.max(f.hideNoFree ? 1 : 0, f.minFreeCount);

  return zones.filter((z) => {
    if (minFreeCount > 0 && getFreeCount(z) < minFreeCount) return false;
    if (f.minConf > 0 && z.confidence < f.minConf) return false;
    if (f.maxPay !== null && z.pay > f.maxPay) return false;
    return true;
  });
}