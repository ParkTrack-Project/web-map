import { MapPin } from 'lucide-react';
import type { PolygonGeometry } from '../model/zone.types';
import { useParkingAddress } from '../queries/parking-address.queries';
import { useI18n } from '@/shared/lib/i18n';

interface ParkingAddressProps {
  zoneId: number;
  geometry: PolygonGeometry | null | undefined;
  suppliedAddress?: string | null | undefined;
  className?: string;
  truncate?: boolean;
}

export function ParkingAddress({
  zoneId,
  geometry,
  suppliedAddress,
  className = '',
  truncate = true,
}: ParkingAddressProps) {
  const { t } = useI18n();
  const { address, isResolving } = useParkingAddress(zoneId, geometry, suppliedAddress);
  if (!address) return null;

  return (
    <p
      className={`flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 ${className}`}
      title={address}
      aria-label={t('zone.address', { address })}
      aria-busy={isResolving}
    >
      <MapPin size={14} className="shrink-0" aria-hidden />
      <span className={truncate ? 'truncate' : 'break-words'}>{address}</span>
    </p>
  );
}
