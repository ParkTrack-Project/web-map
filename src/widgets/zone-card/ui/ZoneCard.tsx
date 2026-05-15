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
import { useState } from 'react';
import { X, Lock, Accessibility, Car, MapPin, Navigation } from 'lucide-react';
import { useSelectedZone } from '@/features/select-zone';
import { useTimeMode } from '@/features/select-time-mode';
import { useZoneByIdQuery, useCreateRouteMutation, type Zone } from '@/entities/zone';
import { buildRoutingBody } from '@/widgets/results-panel';
import { useFromCoords, useGeolocationRequest } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useRouteId, RouteSummaryCard } from '@/widgets/route-preview-summary';
import { pluralizeRu, formatRelativeRu } from '@/shared/lib/i18n';
import { Spinner } from '@/shared/ui';

const LOCATION_TYPE_RU: Record<string, string> = {
  street: 'Уличная',
  yard: 'Дворовая',
  open_lot: 'Открытая площадка',
  underground: 'Подземная',
  multilevel: 'Многоуровневая',
};

export function ZoneCard() {
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
      className="absolute top-0 right-0 z-30 hidden h-full w-[400px] overflow-y-auto bg-white shadow-2xl lg:block"
      aria-label="Карточка парковки"
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
  // Plan 05 / TIME-07: mode инжектится в useZoneByIdQuery → atomic card refetch.
  const { mode, setNow } = useTimeMode();
  const { data, isPending, isError, refetch } = useZoneByIdQuery(zoneId, mode);

  return (
    <div className="flex flex-col gap-4 p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Парковка #{zoneId}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть карточку"
          className="rounded p-1 hover:bg-zinc-100"
        >
          <X size={20} aria-hidden />
        </button>
      </header>

      {isPending && <Spinner label="Загрузка карточки…" />}
      {isError && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          Не удалось загрузить карточку парковки.{' '}
          <button onClick={() => refetch()} className="underline">
            Повторить
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
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-zinc-700">Зона неактивна в этот период</p>
          {mode.kind !== 'now' && (
            <button
              type="button"
              onClick={setNow}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Вернуться к Сейчас
            </button>
          )}
        </div>
      )}
      {data && data.is_active !== false && <ZoneCardBody zone={data} />}
    </div>
  );
}

function ZoneCardBody({ zone }: { zone: Zone }) {
  // CARD-06: русская плюрализация мест.
  const placeWord = pluralizeRu(zone.free_count, {
    one: 'место',
    few: 'места',
    many: 'мест',
  });
  // CARD-02: «обновлено N минут назад» через date-fns с ru-локалью.
  const updatedRu = formatRelativeRu(zone.occupancy_updated_at);

  return (
    <>
      <div className="text-3xl font-bold">
        {zone.free_count} {placeWord}
        <span className="ml-2 text-base font-normal text-zinc-500">из {zone.capacity}</span>
      </div>

      <div className="text-sm text-zinc-600">
        Уверенность данных: {Math.round(zone.confidence * 100)}%
        <span className="ml-2 text-zinc-500">обновлено {updatedRu}</span>
      </div>

      {/* CARD-04: цена или «Бесплатно» */}
      <div className="text-base">
        {zone.pay === 0 ? (
          <span className="font-semibold text-emerald-700">Бесплатно</span>
        ) : (
          <span>{zone.pay} ₽/час</span>
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
          {zone.zone_type === 'parallel' ? 'Параллельная' : 'Стандартная'}
        </li>
        <li className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1">
          {LOCATION_TYPE_RU[zone.location_type] ?? zone.location_type}
        </li>
        {zone.is_private && (
          <li className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-amber-900">
            <Lock size={14} aria-hidden /> Частная
          </li>
        )}
        {zone.is_accessible && (
          <li className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-900">
            <Accessibility size={14} aria-hidden /> Для инвалидов
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
  const { from, setFromCoords } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();
  const geo = useGeolocationRequest();
  const { setRouteId, routeId } = useRouteId();
  const createRoute = useCreateRouteMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg('Не удалось построить маршрут');
      return;
    }
    try {
      const route = await createRoute.mutateAsync({
        body: { ...body, selected_zone_id: zoneId },
      });
      setRouteId(route.route_id);
    } catch (e) {
      setErrorMsg('Не удалось построить маршрут');
      console.warn('[zone-card] route create failed', e);
    }
  };

  if (routeId !== null) {
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
        {busy ? <Spinner /> : <Navigation size={16} aria-hidden />}
        {geo.state.status === 'requesting' ? 'Определяем геолокацию…' : 'Построить маршрут'}
      </button>
      {shownError && (
        <p role="alert" className="text-sm text-red-700">
          {shownError}{' '}
          <button onClick={handleBuildRoute} className="underline">
            Повторить
          </button>
        </p>
      )}
    </>
  );
}
