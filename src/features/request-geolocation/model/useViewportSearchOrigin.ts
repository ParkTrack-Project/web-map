import { useQueryState } from 'nuqs';
import { ITMO_CENTER } from '@/shared/config';
import { centerFromBbox, type Bbox } from '@/shared/lib/geo';
import { parseAsBbox } from '@/shared/lib/url';

export function searchOriginFromBbox(bbox: Bbox | null): [number, number] {
  const [longitude, latitude] = bbox ? centerFromBbox(bbox) : ITMO_CENTER;
  return [latitude, longitude];
}

export function useViewportSearchOrigin(): [number, number] {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  return searchOriginFromBbox(bbox);
}
