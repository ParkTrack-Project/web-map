import { useQuery } from '@tanstack/react-query';
import { zoneCentroid } from '@/shared/lib/geo';
import { lookupAddressAt } from '@/shared/lib/yandex';
import type { PolygonGeometry } from '../model/zone.types';

function coordinateFallback(geometry: PolygonGeometry): string {
  const [longitude, latitude] = zoneCentroid(geometry);
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function useParkingAddress(
  zoneId: number,
  geometry: PolygonGeometry | null | undefined,
  suppliedAddress?: string | null,
) {
  const normalizedAddress = suppliedAddress?.trim() || null;
  const center = geometry?.coordinates?.[0]?.length ? zoneCentroid(geometry) : null;
  const query = useQuery({
    queryKey: ['parking-address', zoneId, center] as const,
    queryFn: ({ signal }) => lookupAddressAt(center!, signal),
    enabled: normalizedAddress === null && center !== null,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 24 * 60 * 60_000,
    retry: 1,
  });

  return {
    address:
      normalizedAddress ??
      query.data ??
      (geometry?.coordinates?.[0]?.length ? coordinateFallback(geometry) : null),
    isResolving: query.isFetching,
  };
}
