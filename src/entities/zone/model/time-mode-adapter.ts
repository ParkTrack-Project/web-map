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
