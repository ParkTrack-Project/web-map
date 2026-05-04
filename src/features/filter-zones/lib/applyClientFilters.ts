// D-12 client-side: minConf и maxPay применяются на клиенте как safety-net.
// Server-side эквиваленты (min_confidence, max_pay) тоже отправляются — если backend
// их понимает, double-filter без эффекта. Если backend отвечает 400 — fallback OK.
import type { ZoneMapItem } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';

export function applyClientFilters(zones: ZoneMapItem[], f: ZoneFilters): ZoneMapItem[] {
  return zones.filter((z) => {
    if (f.minConf > 0 && z.confidence < f.minConf) return false;
    if (f.maxPay !== null && z.pay > f.maxPay) return false;
    return true;
  });
}
