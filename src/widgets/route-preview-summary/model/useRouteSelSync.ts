import { useEffect } from 'react';
import { useRouteByIdQuery } from '@/entities/zone';
import { useSelectedZone } from '@/features/select-zone';
import { useRouteId } from './useRouteId';

export function useRouteSelSync() {
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  useEffect(() => {
    if (!route) return;
    if (selectedZoneId !== null) return; // НЕ переписываем существующий ?sel
    setSelectedZone(route.selected_zone_id);
  }, [route, selectedZoneId, setSelectedZone]);
}
