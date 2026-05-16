// Phase 4 / ROUTE-05 / D-31:
// ETA + distance + arrival summary + [В путь] CTA → opens deeplink menu.
// Mounted parent'ом когда ?route присутствует (parent ZoneCardBody уже gates).
//
// - eta_seconds → «N мин» через ceil/60 (минуты, округлённые вверх)
// - distance → Intl.NumberFormat ru-RU: метры, либо километры при ≥ 1000 м
// - arrival_time → Intl.DateTimeFormat HH:MM с timeZone:'Europe/Moscow' → «Прибытие в HH:MM МСК»
// - coordsValid := isValidCoords(from) && isValidCoords([zoneLat, zoneLon])
//   зашит в DesktopDeeplinkPopover/MobileDeeplinkSheet (disabled trigger при !coordsValid).
import { useEffect, useMemo } from 'react';
import { Clock, Ruler } from 'lucide-react';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useFromCoords } from '@/features/request-geolocation';
import { isValidCoords } from '@/shared/lib/deeplink';
import { DesktopDeeplinkPopover, MobileDeeplinkSheet } from '@/widgets/deeplink-menu';
import { useRouteId } from '../model/useRouteId';

export function RouteSummaryCard() {
  const { routeId, clearRouteId } = useRouteId();
  const { data: route, isPending, isError } = useRouteByIdQuery(routeId);
  const { from } = useFromCoords();

  // Маршрут не найден (404 после перезапуска сервера) — сбрасываем ?route из URL,
  // чтобы BuildRouteSection снова показал кнопку «Построить маршрут».
  useEffect(() => {
    if (isError) clearRouteId();
  }, [isError, clearRouteId]);

  const zoneCenterLatLon = useMemo<[number, number] | null>(() => {
    if (!route) return null;
    // W-4 fix: minimal-shape принимается напрямую.
    const [lon, lat] = zoneCentroid(route.selected_candidate.geometry);
    return [lat, lon];
  }, [route]);

  const arrivalLabel = useMemo(() => {
    if (!route?.arrival_time) return null;
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    }).format(new Date(route.arrival_time));
  }, [route?.arrival_time]);

  if (!routeId || isPending || isError || !route) return null;

  const etaMin = Math.max(1, Math.ceil(route.eta_seconds / 60));
  const distance = route.selected_candidate.distance_from_origin_meters;
  // > 1 км → километры с одним знаком после запятой (2600 м → 2,6 км),
  // иначе — метры.
  const distanceLabel =
    distance >= 1000
      ? new Intl.NumberFormat('ru-RU', {
          style: 'unit',
          unit: 'kilometer',
          unitDisplay: 'short',
          maximumFractionDigits: 1,
        }).format(distance / 1000)
      : new Intl.NumberFormat('ru-RU', {
          style: 'unit',
          unit: 'meter',
          unitDisplay: 'short',
        }).format(distance);
  const coordsValid = isValidCoords(from) && isValidCoords(zoneCenterLatLon);

  return (
    <div
      data-testid="route-summary-card"
      className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm"
    >
      <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
        Маршрут построен
      </p>
      <div className="flex items-center gap-3 text-zinc-800">
        <span className="inline-flex items-center gap-1">
          <Clock size={14} aria-hidden /> {etaMin} мин
        </span>
        <span className="inline-flex items-center gap-1">
          <Ruler size={14} aria-hidden /> {distanceLabel}
        </span>
      </div>
      {arrivalLabel && <p className="text-xs text-zinc-600">Прибытие в {arrivalLabel} МСК</p>}
      <div className="hidden lg:block">
        <DesktopDeeplinkPopover from={from} to={zoneCenterLatLon} coordsValid={coordsValid} />
      </div>
      <div className="lg:hidden">
        <MobileDeeplinkSheet from={from} to={zoneCenterLatLon} coordsValid={coordsValid} />
      </div>
    </div>
  );
}
