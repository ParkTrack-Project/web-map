// 2026-05-26: единый форматтер длительности для UI «время в пути».
// До этого ResultItem/RouteSummaryCard печатали `Math.ceil(seconds / 60) + ' мин'`
// → для дальних маршрутов получали портянку «4000 мин» вместо человеческого
// «2 д 18 ч». Теперь конвертируем в естественные единицы (как Яндекс.Карты):
//
//   < 60 c   → «1 мин» (клемпим к минимуму, чтобы не показывать «0 мин»)
//   < 60 м   → «N мин»
//   < 24 ч   → «N ч M мин» (или «N ч» если M=0)
//   ≥ 24 ч   → «N д M ч»  (или «N д» если M=0)
//
// Принципиально показываем не больше двух единиц (Яндекс делает так же) —
// «2 д 18 ч» гораздо читабельнее, чем «2 д 18 ч 40 мин» в маленькой плашке.
// Аббревиатуры «мин/ч/д» в русском падежно-инвариантны → pluralizeRu не нужен.
//
// На вход — секунды (как у нас в API: eta_seconds, duration_from_origin_seconds).
// Внутри Math.ceil — не занижаем ETA (RouteSummaryCard уже так считал ceil;
// ResultItem использовал round — теперь единая семантика «не быстрее чем»).

export function formatDurationFromSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '1 мин';
  const totalMin = Math.max(1, Math.ceil(seconds / 60));
  if (totalMin < 60) return `${totalMin} мин`;

  const totalHours = Math.floor(totalMin / 60);
  const restMin = totalMin % 60;
  if (totalHours < 24) {
    return restMin === 0 ? `${totalHours} ч` : `${totalHours} ч ${restMin} мин`;
  }

  const days = Math.floor(totalHours / 24);
  const restHours = totalHours % 24;
  return restHours === 0 ? `${days} д` : `${days} д ${restHours} ч`;
}
