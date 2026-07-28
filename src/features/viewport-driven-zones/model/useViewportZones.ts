import { useQueryState } from 'nuqs';
import { parseAsBbox } from '@/shared/lib/url';
import { useZonesQuery } from '@/entities/zone';
import { useTimeMode } from '@/features/select-time-mode';
import type { Bbox } from '@/shared/lib/geo';

export function useViewportZones() {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const { mode } = useTimeMode();
  return { bbox, ...useZonesQuery(bbox, {}, mode) };
}
