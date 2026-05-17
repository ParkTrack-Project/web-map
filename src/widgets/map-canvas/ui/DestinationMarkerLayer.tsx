// Quick-fix 2026-05-16: маркер выбранного адреса (?dest).
// Раньше при выборе адреса карта только зумилась — не было видно, ГДЕ
// конкретно точка. Рисуем розовый маркер в ?dest, пока он установлен.
// - Отдельный от RoutePreviewLayer (origin emerald / зона amber) — это «куда
//   хочет попасть пользователь», другой семантический слой.
// - memo: ?dest меняется редко, лишние ре-рендеры при панораме карты не нужны.
import { memo } from 'react';
import { MapPin } from 'lucide-react';
import { YMapMarker } from '@/shared/lib/ymaps';
import { useDestination } from '@/features/address-search';

function DestinationMarkerLayerInner() {
  const { dest } = useDestination();
  if (!dest) return null;
  const [lat, lon] = dest;

  return (
    // Yandex coordinates order — [lon, lat].
    <YMapMarker coordinates={[lon, lat]}>
      <div
        title="Выбранный адрес"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md ring-2 ring-white"
      >
        <MapPin size={14} aria-hidden />
      </div>
    </YMapMarker>
  );
}

export const DestinationMarkerLayer = memo(DestinationMarkerLayerInner);
