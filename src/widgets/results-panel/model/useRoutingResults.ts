// 2026-05-17 (fix 3): авто-расширение радиуса поиска парковок к адресу.
//
// Проблема: при mode=route_to_destination фронт слал жёстко 500 м (D-14), а
// backend find_candidates режет все зоны дальше 500 м от пина адреса. Для
// длинных parallel-зон центроид легко >500 м, плюс погрешность геокодера →
// «Всего вариантов: 0», хотя парковки рядом видны на карте.
//
// Решение: единая точка входа для всех потребителей результатов. Если поиск
// вернул 0 кандидатов (и есть адрес-назначение) — автоматически повторяем с
// бóльшим радиусом по лестнице ROUTING_DEST_RADII_M (500 → 1500 → 3000).
// Лестница сбрасывается на первый шаг при смене from/dest/filters/mode.
//
// Все 3 потребителя (DesktopResultsPanel, MobileResultsSheet,
// MobileResultsButton) зовут этот хук с одним query-кэшем → согласованный
// радиус и результат, без дублей запросов (TanStack дедупит по queryKey).
import { useEffect, useMemo, useState } from 'react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';
import { useRoutingSearch } from '@/entities/zone';
import { ROUTING_DEST_RADII_M } from '@/shared/config';
import { buildRoutingBody } from './useRoutingSearchBody';

const MAX_IDX = ROUTING_DEST_RADII_M.length - 1;

export function useRoutingResults() {
  const { from } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();

  const [radiusIdx, setRadiusIdx] = useState(0);

  // Ключ «входных» параметров поиска — при их смене начинаем заново с 500 м.
  const baseKey = useMemo(
    () => JSON.stringify([from, dest, filters, mode]),
    [from, dest, filters, mode],
  );
  useEffect(() => {
    setRadiusIdx(0);
  }, [baseKey]);

  const radiusMeters = ROUTING_DEST_RADII_M[Math.min(radiusIdx, MAX_IDX)]!;
  const body = useMemo(
    () => buildRoutingBody({ from, dest, filters, mode, destRadiusMeters: radiusMeters }),
    [from, dest, filters, mode, radiusMeters],
  );
  // В режиме «Сейчас» панель авто-обновляет живые free_count раз в минуту.
  const query = useRoutingSearch(body, mode.kind === 'now');

  // Эскалация: данные именно для текущего радиуса (не placeholder/не в полёте),
  // адрес задан, кандидатов 0 и ещё есть куда расширяться.
  const canExpand =
    !!dest &&
    !query.isPlaceholderData &&
    !query.isFetching &&
    query.data?.total_candidates === 0 &&
    radiusIdx < MAX_IDX;
  useEffect(() => {
    if (canExpand) setRadiusIdx((i) => i + 1);
  }, [canExpand]);

  return { ...query, body, radiusMeters, expanded: radiusIdx > 0 };
}
