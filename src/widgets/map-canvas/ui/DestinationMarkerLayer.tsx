// Quick-fix 2026-05-16: маркер выбранного адреса (?dest).
import { memo, type ComponentType, type ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { YMapMarker as YMapMarkerRaw } from '@/shared/lib/ymaps';
import { useDestination } from '@/features/address-search';
import { useI18n } from '@/shared/lib/i18n';

type YMapMarkerProps = {
  coordinates: [number, number];
  zIndex?: number;
  source?: string;
  children?: ReactNode;
};

const YMapMarker = YMapMarkerRaw as unknown as ComponentType<YMapMarkerProps>;

function DestinationMarkerLayerInner() {
  const { t } = useI18n();
  const { dest } = useDestination();

  if (!dest) return null;

  const [lat, lon] = dest;

  return (
    <YMapMarker coordinates={[lon, lat]}>
      <div
        title={t('map.selectedAddress')}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md ring-2 ring-white"
      >
        <MapPin size={14} aria-hidden />
      </div>
    </YMapMarker>
  );
}

export const DestinationMarkerLayer = memo(DestinationMarkerLayerInner);
