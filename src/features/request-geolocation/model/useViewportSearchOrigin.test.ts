import { describe, expect, it } from 'vitest';
import { ITMO_CENTER } from '@/shared/config';
import { searchOriginFromBbox } from './useViewportSearchOrigin';

describe('searchOriginFromBbox', () => {
  it('returns the viewport center in [lat, lon] order', () => {
    expect(searchOriginFromBbox([30, 59, 32, 61])).toEqual([60, 31]);
  });

  it('falls back to the configured map center', () => {
    expect(searchOriginFromBbox(null)).toEqual([ITMO_CENTER[1], ITMO_CENTER[0]]);
  });
});
