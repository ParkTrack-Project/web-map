// TIME-02 / D-13: единственная точка перевода TimeMode → endpoint.
// ТЗ §15 hard-separation rule выражено одной функцией. Любой консумер
// (zones, occupancy, forecasts; будущий Phase 4 ranking) идёт через адаптер —
// нет места для забытого endpoint switch.
import type { TimeMode } from './zone.types';

export interface TimeModeRequest {
  endpoint: '/zones' | '/occupancy' | '/forecasts';
  extraParams: Record<string, string>;
}

export function timeModeAdapter(mode: TimeMode): TimeModeRequest {
  switch (mode.kind) {
    case 'now':
      return { endpoint: '/zones', extraParams: {} };
    case 'past':
      return { endpoint: '/occupancy', extraParams: { at: mode.at, view: 'map' } };
    case 'future':
      return { endpoint: '/forecasts', extraParams: { at: mode.at, view: 'map' } };
  }
}
