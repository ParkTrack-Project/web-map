import { beforeEach, describe, expect, it } from 'vitest';
import { shouldDimCluster, shouldDimZone, useResultSelection } from './result-selection.store';

describe('result selection', () => {
  beforeEach(() => {
    useResultSelection.getState().clearResultSelection();
  });

  it('keeps the last viewed result while it remains in the result set', () => {
    useResultSelection.getState().setResultZoneIds([10, 20]);
    useResultSelection.getState().markZoneViewed(20);
    useResultSelection.getState().setResultZoneIds([20, 30]);
    expect(useResultSelection.getState().lastViewedZoneId).toBe(20);
  });

  it('does not mark a zone outside the search results', () => {
    useResultSelection.getState().setResultZoneIds([10]);
    useResultSelection.getState().markZoneViewed(99);
    expect(useResultSelection.getState().lastViewedZoneId).toBeNull();
  });

  it('dims non-results and then every zone except the opened one', () => {
    expect(shouldDimZone(30, null, [10, 20])).toBe(true);
    expect(shouldDimZone(20, null, [10, 20])).toBe(false);
    expect(shouldDimZone(20, 10, [10, 20])).toBe(true);
    expect(shouldDimZone(10, 10, [10, 20])).toBe(false);
  });

  it('keeps clusters containing a relevant zone emphasized', () => {
    expect(shouldDimCluster([10, 11], null, [11, 20])).toBe(false);
    expect(shouldDimCluster([10, 11], 20, [11, 20])).toBe(true);
  });
});
