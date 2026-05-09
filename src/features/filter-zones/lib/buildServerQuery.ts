// D-12: маппинг UI-фильтров → API query params.
// Параметры с дефолтным значением НЕ отправляются (короткий URL → меньше нагрузки на API).
// Если API вернёт 400/422 на любой из этих params — fallback на client-side
// фильтрацию (см. docs/filters-contract.md и Phase 5 интеграцию).
//
// FILTER-06 инверсия: locationType хранит ВИДИМЫЕ типы; сервер ожидает СКРЫТЫЕ.
import { ALL_LOCATION_TYPES, type ZoneFilters } from '@/entities/filters';

export function buildServerQuery(f: ZoneFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.hideNoFree) q.min_free_count = '1';
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
