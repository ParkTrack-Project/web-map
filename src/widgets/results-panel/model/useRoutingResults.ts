// Единая точка поиска для desktop/mobile consumers. Тело не ограничивает
// кандидатов радиусом: backend возвращает общий ranked-список, где ближайшие
// к origin/destination зоны остаются выше, но дальние не отсекаются.
import { useMemo } from 'react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';
import { useRoutingSearch } from '@/entities/zone';
import { buildRoutingBody } from './useRoutingSearchBody';

export function useRoutingResults() {
  const { from } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();

  const body = useMemo(
    () => buildRoutingBody({ from, dest, filters, mode }),
    [from, dest, filters, mode],
  );
  // В режиме «Сейчас» панель авто-обновляет живые free_count раз в минуту.
  const query = useRoutingSearch(body, mode.kind === 'now');

  return { ...query, body };
}
