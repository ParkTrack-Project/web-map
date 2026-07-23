// Phase 4 / ROUTE-05 / D-31:
// ETA + distance + arrival summary + [В путь] CTA → opens deeplink menu.
// Mounted parent'ом когда ?route присутствует (parent ZoneCardBody уже gates).
//
// - eta_seconds → formatDurationFromSeconds: «N мин» / «N ч M мин» / «N д M ч»
//   (Fix 2026-05-26: раньше всегда печатали в минутах → 4000 мин для длинных маршрутов)
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
import { formatDistanceFromMeters, formatDurationFromSeconds, useI18n } from '@/shared/lib/i18n';
import { DesktopDeeplinkPopover, MobileDeeplinkSheet } from '@/widgets/deeplink-menu';
import { useRouteId } from '../model/useRouteId';

export function RouteSummaryCard() {
  const { t, language } = useI18n();
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
    return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    }).format(new Date(route.arrival_time));
  }, [language, route?.arrival_time]);

  if (!routeId || isPending || isError || !route) return null;

  const etaLabel = formatDurationFromSeconds(route.eta_seconds, language);
  const distanceLabel = formatDistanceFromMeters(
    route.selected_candidate.distance_from_origin_meters,
    language,
  );
  const coordsValid = isValidCoords(from) && isValidCoords(zoneCenterLatLon);

  return (
    <div
      data-testid="route-summary-card"
      className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-transparent dark:!bg-emerald-950"
    >
      <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
        {t('route.built')}
      </p>
      <div className="flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
        <span className="inline-flex items-center gap-1">
          <Clock size={14} aria-hidden /> {etaLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <Ruler size={14} aria-hidden /> {distanceLabel}
        </span>
      </div>
      {arrivalLabel && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
          {t('route.arrival', { time: arrivalLabel })}
        </p>
      )}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-[11px] text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        {t('route.dataAttribution')}
      </a>
      <div className="hidden lg:block">
        <DesktopDeeplinkPopover from={from} to={zoneCenterLatLon} coordsValid={coordsValid} />
      </div>
      <div className="lg:hidden">
        <MobileDeeplinkSheet from={from} to={zoneCenterLatLon} coordsValid={coordsValid} />
      </div>
    </div>
  );
}
