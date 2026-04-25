// CARD-01..07 / D-05: Десктоп карточка — anchored right-side panel 400px,
// overlay над картой (карта НЕ ужимается — D-05 «карточка лежит position:absolute»).
// CARD-07 desktop: НЕ авто-центрируем карту (избегаем jump-effect, D-07 desktop half).
// D-08a: ключ {selectedZoneId} на ZoneCardContent → smooth re-render при быстром
// перетыке зон, не unmount/remount.
//
// Hidden lg:block — на мобильном показывается MobileZoneCard (vaul Portal).
// Оба компонента слушают один и тот же useSelectedZone.
import { X, Lock, Accessibility, Car, MapPin } from 'lucide-react';
import { useSelectedZone } from '@/features/select-zone';
import { useZoneByIdQuery, type Zone } from '@/entities/zone';
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
  if (selectedZoneId == null) return null;

  return (
    <aside
      className="absolute top-0 right-0 z-30 hidden h-full w-[400px] overflow-y-auto bg-white shadow-2xl lg:block"
      aria-label="Карточка парковки"
    >
      {/* D-08a: key={selectedZoneId} — React reconciliation вместо unmount/remount
          при быстром перетыке зон (race-guard). */}
      <ZoneCardContent key={selectedZoneId} zoneId={selectedZoneId} onClose={closeCard} />
    </aside>
  );
}

interface ContentProps {
  zoneId: number;
  onClose: () => void;
}

export function ZoneCardContent({ zoneId, onClose }: ContentProps) {
  const { data, isPending, isError, refetch } = useZoneByIdQuery(zoneId);

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
      {data && <ZoneCardBody zone={data} />}
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

      {/* CARD-05: кнопка маршрута — Phase 4 wires action (setDestination → /routing/new). */}
      <button
        type="button"
        className="mt-2 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        onClick={() => {
          // TODO Phase 4: setDestination(zoneCentroid(zone.geometry)) → /routing/new
          console.debug('[ptk] route to zone', zone.zone_id);
        }}
      >
        Построить маршрут
      </button>
    </>
  );
}
