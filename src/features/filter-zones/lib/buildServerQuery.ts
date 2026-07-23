import { ALL_LOCATION_TYPES, type ZoneFilters } from '@/entities/filters';

export function buildServerQuery(f: ZoneFilters): Record<string, string> {
  const q: Record<string, string> = {};
  const minFreeCount = Math.max(f.hideNoFree ? 1 : 0, f.minFreeCount);

  if (minFreeCount > 0) {
    q.min_free_count = String(minFreeCount);
  }
  if (f.minConf > 0) q.min_confidence = String(f.minConf);
  if (f.maxPay !== null) q.max_pay = String(f.maxPay);
  if (f.hidePrivate) q.include_private = 'false';
  if (f.hideAccessible) q.include_accessible = 'false';
  if (f.hideInactive) q.is_active = 'true';
  if (f.locationType.length > 0) {
    const hidden = ALL_LOCATION_TYPES.filter((t) => !f.locationType.includes(t));
    if (hidden.length > 0) q.hide_location_types = hidden.join(',');
  }
  return q;
}
