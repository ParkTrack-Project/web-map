import { describe, it, expect } from 'vitest';
import { applyClientCandidateFilters } from './applyClientCandidateFilters';
import type { RouteCandidate } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';

const baseCandidate: RouteCandidate = {
  zone_id: 1,
  camera_id: null,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ],
  },
  zone_type: 'standard',
  location_type: 'street',
  is_accessible: false,
  pay: 100,
  capacity: 5,
  current_occupied: 2,
  current_free_count: 3,
  current_confidence: 0.8,
  predicted_for_arrival: null,
  predicted_occupied: null,
  predicted_free_count: null,
  probability_free_space: null,
  forecast_confidence: null,
  distance_from_origin_meters: 500,
  duration_from_origin_seconds: 120,
  distance_to_destination_meters: null,
  duration_to_destination_seconds: null,
  score: 0.5,
  rank: 1,
};

const baseFilters: ZoneFilters = {
  hideNoFree: false,
  minFreeCount: 0,
  minConf: 0,
  maxPay: null,
  hidePrivate: false,
  hideAccessible: false,
  locationType: [],
  hideInactive: true,
};

describe('applyClientCandidateFilters (D-25 / Pitfall 8)', () => {
  it('returns identical list когда filters all default', () => {
    const list = [baseCandidate];
    expect(applyClientCandidateFilters(list, baseFilters)).toEqual(list);
  });
  it('minConf фильтрует по current_confidence', () => {
    const lowConf = { ...baseCandidate, current_confidence: 0.5 };
    const out = applyClientCandidateFilters([baseCandidate, lowConf], {
      ...baseFilters,
      minConf: 0.7,
    });
    expect(out).toEqual([baseCandidate]);
  });
  it('maxPay фильтрует по pay', () => {
    const expensive = { ...baseCandidate, pay: 500 };
    const out = applyClientCandidateFilters([baseCandidate, expensive], {
      ...baseFilters,
      maxPay: 200,
    });
    expect(out).toEqual([baseCandidate]);
  });
  it('hideAccessible отбрасывает is_accessible=true', () => {
    const accessible = { ...baseCandidate, is_accessible: true };
    const out = applyClientCandidateFilters([baseCandidate, accessible], {
      ...baseFilters,
      hideAccessible: true,
    });
    expect(out).toEqual([baseCandidate]);
  });
  it('hideNoFree отбрасывает current_free_count===0', () => {
    const empty = { ...baseCandidate, current_free_count: 0 };
    const out = applyClientCandidateFilters([baseCandidate, empty], {
      ...baseFilters,
      hideNoFree: true,
    });
    expect(out).toEqual([baseCandidate]);
  });
  it('locationType=[] не фильтрует', () => {
    const yard = { ...baseCandidate, location_type: 'yard' as const };
    expect(applyClientCandidateFilters([baseCandidate, yard], baseFilters)).toEqual([
      baseCandidate,
      yard,
    ]);
  });
  it('locationType=["street"] оставляет только street', () => {
    const yard = { ...baseCandidate, location_type: 'yard' as const };
    expect(
      applyClientCandidateFilters([baseCandidate, yard], {
        ...baseFilters,
        locationType: ['street'],
      }),
    ).toEqual([baseCandidate]);
  });
});
