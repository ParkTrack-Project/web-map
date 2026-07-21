// CARD-01..07 / D-05: Десктоп карточка — anchored right-side panel 400px,
// overlay над картой (карта НЕ ужимается — D-05 «карточка лежит position:absolute»).
// CARD-07 desktop: НЕ авто-центрируем карту (избегаем jump-effect, D-07 desktop half).
// D-08a: ключ {selectedZoneId} на ZoneCardContent → smooth re-render при быстром
// перетыке зон, не unmount/remount.
//
// Hidden lg:block — на мобильном показывается MobileZoneCard (vaul Portal).
// Оба компонента слушают один и тот же useSelectedZone.
//
// Phase 3 Plan 05 / TIME-07 / D-16:
// - useTimeMode().mode инжектится в useZoneByIdQuery → atomic card mode-switch
//   (queryKey включает mode → smena ?t= → новый запрос /occupancy?view=card&...)
// - is_active === false → empty-state «Зона неактивна в этот период»
//   + CTA «Вернуться к Сейчас» (когда mode != now). Pattern из ZoneStateOverlay (Plan 04).
//
// Phase 4 Plan 04 / D-27 / D-28:
// - BuildRouteSection wires CARD-05 [Построить маршрут] → useCreateRouteMutation
// - На success → setRouteId → ?route=<id> в URL → RouteSummaryCard renders inline
// - Закрытие карточки (X / outside click) → clearRouteId + closeCard atomically
import { useEffect, useState } from 'react';
import { X, Lock, Accessibility, Car, MapPin, Navigation } from 'lucide-react';
import { useSelectedZone } from '@/features/select-zone';
import { useTimeMode } from '@/features/select-time-mode';
import {
  useZoneByIdQuery,
  useCreateRouteMutation,
  useRouteByIdQuery,
  type Zone,
  type RoutingNewBody,
} from '@/entities/zone';
import { buildRoutingBody } from '@/widgets/results-panel';
import { useFromCoords, useGeolocationRequest } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useRouteId, RouteSummaryCard } from '@/widgets/route-preview-summary';
import { useZoomToZone } from '@/widgets/map-canvas';
import { formatRelative, useI18n, type MessageKey } from '@/shared/lib/i18n';
import { Spinner } from '@/shared/ui';

export function ZoneCard() {
  const { t } = useI18n();
  const { selectedZoneId, closeCard } = useSelectedZone();
  // D-28: при закрытии карточки — atomic clear ?route + ?sel.
  const { clearRouteId } = useRouteId();
  const handleClose = () => {
    clearRouteId();
    closeCard();
  };
  if (selectedZoneId == null) return null;

  return (
    <aside
      className="surface-opaque absolute top-0 right-0 z-30 hidden h-full w-[400px] overflow-y-auto bg-white shadow-2xl lg:block dark:bg-zinc-900"
      aria-label={t('zone.card')}
    >
      {/* D-08a: key={selectedZoneId} — React reconciliation вместо unmount/remount
          при быстром перетыке зон (race-guard). */}
      <ZoneCardContent key={selectedZoneId} zoneId={selectedZoneId} onClose={handleClose} />
    </aside>
  );
}

interface ContentProps {
  zoneId: number;
  onClose: () => void;
}

export function ZoneCardContent({ zoneId, onClose }: ContentProps) {
  const { t } = useI18n();
  // Plan 05 / TIME-07: mode инжектится в useZoneByIdQuery → atomic card refetch.
  const { mode, setNow } = useTimeMode();
  const { data, isPending, isError, refetch } = useZoneByIdQuery(zoneId, mode);
  const zoomToZone = useZoomToZone();

  return (
    <div
      className="flex flex-col gap-4 p-5"
      // 2026-05-30: клик по карточке парковки → максимальный зум на неё. Клики по
      // кнопкам/ссылкам внутри (Закрыть, Построить маршрут, Повторить) не трогаем.
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a')) return;
        if (data?.geometry) zoomToZone(data.geometry, { max: true });
      }}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('zone.title', { id: zoneId })}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('zone.close')}
          className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X size={20} aria-hidden />
        </button>
      </header>

      {isPending && <Spinner label={t('zone.loading')} />}
      {isError && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {t('zone.error')}{' '}
          <button onClick={() => refetch()} className="underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {/* Plan 05 / D-16: «Зона неактивна в этот период» empty-state.
          Возникает фактически в past/future, когда зона была не-активна на выбранный момент.
          CTA «Вернуться к Сейчас» — только при mode != now (pattern из ZoneStateOverlay). */}
      {data && data.is_active === false && (
        <div
          role="status"
          data-testid="zone-card-inactive"
          className="surface-opaque rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-700">{t('zone.inactive')}</p>
          {mode.kind !== 'now' && (
            <button
              type="button"
              onClick={setNow}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              {t('time.returnNow')}
            </button>
          )}
        </div>
      )}
      {data && data.is_active !== false && <ZoneCardBody zone={data} mode={mode} />}
    </div>
  );
}

function ZoneCardBody({
  zone,
  mode,
}: {
  zone: Zone;
  mode: ReturnType<typeof useTimeMode>['mode'];
}) {
  const { t, language, formatCount } = useI18n();

  // 2026-05-30: тип локации может прийти пустым/неизвестным — тогда НЕ рисуем
  // бейдж вовсе (иначе пустой серый прямоугольник рядом с типом зоны).
  const locationLabel = zone.location_type ? t(`location.${zone.location_type}` as MessageKey) : '';

  const forecastCreatedAt =
    (zone as unknown as { forecast_created_at?: string | null }).forecast_created_at ??
    zone.occupancy_updated_at;

  const displayedAt =
    (zone as unknown as { displayed_at?: string | null }).displayed_at ??
    (zone as unknown as { predicted_for?: string | null }).predicted_for ??
    (zone as unknown as { forecasted_at?: string | null }).forecasted_at ??
    (zone as unknown as { forecast_at?: string | null }).forecast_at;

  const updatedRu = formatRelative(zone.occupancy_updated_at, language);
  const forecastCreatedRu = formatRelative(forecastCreatedAt, language);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return t('zone.unknown');

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return t('zone.unknown');

    return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const confidencePercent = Math.round(Math.max(0, Math.min(1, zone.confidence)) * 100);

  return (
    <>
      <div className="text-3xl font-bold">
        {formatCount('space', zone.free_count)}
        <span className="ml-2 text-base font-normal text-zinc-500">
          {t('zone.ofCapacity', { capacity: zone.capacity })}
        </span>
      </div>

      <div className="text-sm text-zinc-600">
        {t('zone.dataConfidence', { percent: confidencePercent })}
        {mode.kind === 'future' ? (
          <span className="ml-2 text-zinc-500">
            {t('zone.forecastCreated', { time: forecastCreatedRu })}
          </span>
        ) : (
          <span className="ml-2 text-zinc-500">{t('zone.updated', { time: updatedRu })}</span>
        )}
      </div>

      {mode.kind === 'future' && (
        <div className="text-sm font-medium text-emerald-700">
          {t('zone.displayedForecast', { time: formatDateTime(displayedAt) })}
        </div>
      )}

      {/* CARD-04: цена или «Бесплатно» */}
      <div className="text-base">
        {zone.pay === 0 ? (
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            {t('results.freePrice')}
          </span>
        ) : (
          <span>{t('results.hourPrice', { price: zone.pay })}</span>
        )}
      </div>

      {/* CARD-03 / ZONE-04: маркеры (только в карточке, не на карте — PITFALL #6). */}
      <ul className="flex flex-wrap gap-2 text-sm">
        <li className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1">
          {zone.zone_type === 'parallel' ? (
            <MapPin size={14} aria-hidden />
          ) : (
            <Car size={14} aria-hidden />
          )}
          {zone.zone_type === 'parallel' ? t('zone.parallel') : t('zone.standard')}
        </li>
        {locationLabel && (
          <li className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1">{locationLabel}</li>
        )}
        {zone.is_private && (
          <li className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-amber-900">
            <Lock size={14} aria-hidden /> {t('zone.private')}
          </li>
        )}
        {zone.is_accessible && (
          <li className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-900">
            <Accessibility size={14} aria-hidden /> {t('zone.accessible')}
          </li>
        )}
      </ul>

      {/* CARD-05 / D-27: Build route mutation + RouteSummaryCard inline. */}
      <BuildRouteSection zoneId={zone.zone_id} />
    </>
  );
}

/**
 * Phase 4 / D-27 / ROUTE-01 + Quick-fix 2026-05-16 (п.6):
 * Кнопка [Построить маршрут] теперь ВСЕГДА активна. Раньше она была disabled
 * без ?from (требовала заранее нажать «Где припарковаться?»). Теперь по клику:
 *  - если ?from уже есть — строим маршрут сразу;
 *  - если нет — запрашиваем геолокацию прямо здесь, пишем ?from и строим
 *    маршрут от текущего местоположения до этой парковки.
 * body собираем чистым buildRoutingBody с только что полученными координатами
 * (внутри handler'а обновлённый useRoutingSearchBody прочитать нельзя).
 * После success: routeId set → render RouteSummaryCard (с deeplink в навигатор).
 */
function BuildRouteSection({ zoneId }: { zoneId: number }) {
  const { t } = useI18n();
  const { from, setFromCoords } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();
  const geo = useGeolocationRequest();
  const { setRouteId, routeId, clearRouteId } = useRouteId();
  const createRoute = useCreateRouteMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick-fix 2026-05-16: ?route — глобальный URL-стейт. При переходе на другую
  // карточку парковки он оставался от первого маршрута, и каждая карточка
  // показывала RouteSummaryCard с чужими данными. Маршрут привязан к зоне через
  // route.selected_zone_id — сверяем с текущей карточкой.
  const { data: activeRoute } = useRouteByIdQuery(routeId);
  const routeForThisZone = routeId !== null && activeRoute?.selected_zone_id === zoneId;

  // Маршрут построен для другой зоны → сбрасываем ?route, чтобы на этой карточке
  // снова была кнопка «Построить маршрут» (а не данные предыдущего маршрута).
  useEffect(() => {
    if (activeRoute && activeRoute.selected_zone_id !== zoneId) {
      clearRouteId();
    }
  }, [activeRoute, zoneId, clearRouteId]);

  const busy = createRoute.isPending || geo.state.status === 'requesting';
  // geo.state.error реактивно показывает точную причину (отказ/таймаут) после
  // неудачного request() — читать его синхронно в handler ненадёжно (setState async).
  const shownError = errorMsg ?? geo.state.error;

  const handleBuildRoute = async () => {
    setErrorMsg(null);
    let origin = from;
    if (!origin) {
      const coords = await geo.request(); // [lat, lon] | null
      if (!coords) return; // geo.state.error выставлен → отрисуется реактивно
      setFromCoords(coords); // пишем ?from для будущих построений/деплинков
      origin = coords;
    }
    const body = buildRoutingBody({ from: origin, dest, filters, mode });
    if (!body) {
      setErrorMsg(t('zone.routeFailed'));
      return;
    }
    // Fix 2026-05-17: пользователь ЯВНО выбрал эту парковку — не режем её
    // фильтром «в радиусе N м от адреса». Иначе backend find_candidates
    // отбрасывает выбранную зону по дистанции до ?dest → 422 (centroid
    // длинной parallel-зоны + погрешность геокодера легко >500 м). Адрес
    // остаётся для ETA пешком, но не как жёсткий отсев.
    const routeBody: RoutingNewBody = { ...body, selected_zone_id: zoneId };
    delete routeBody.max_distance_to_destination_meters;
    try {
      const route = await createRoute.mutateAsync({ body: routeBody });
      setRouteId(route.route_id);
    } catch (e) {
      setErrorMsg(t('zone.routeFailed'));
      console.warn('[zone-card] route create failed', e);
    }
  };

  if (routeForThisZone) {
    return <RouteSummaryCard />;
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={handleBuildRoute}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        data-testid="build-route-button"
      >
        {busy ? <Spinner label={t('common.loading')} /> : <Navigation size={16} aria-hidden />}
        {geo.state.status === 'requesting' ? t('zone.locating') : t('zone.buildRoute')}
      </button>
      {shownError && (
        <p role="alert" className="text-sm text-red-700">
          {shownError}{' '}
          <button onClick={handleBuildRoute} className="underline">
            {t('common.retry')}
          </button>
        </p>
      )}
    </>
  );
}
