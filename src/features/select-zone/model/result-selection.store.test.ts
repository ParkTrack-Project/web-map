import { beforeEach, describe, expect, it } from 'vitest';
import {
  canHoverResultZone,
  shouldDimCluster,
  shouldDimZone,
  useResultSelection,
} from './result-selection.store';

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

  it('keeps hover limited to search results and clears it conditionally', () => {
    useResultSelection.getState().setResultZoneIds([10, 20]);
    useResultSelection.getState().setHoveredZone(99);
    expect(useResultSelection.getState().hoveredZoneId).toBeNull();

    useResultSelection.getState().setHoveredZone(20, 'map');
    expect(useResultSelection.getState().hoveredZoneId).toBe(20);
    expect(useResultSelection.getState().hoveredZoneSource).toBe('map');
    useResultSelection.getState().clearHoveredZone(10, 'map');
    expect(useResultSelection.getState().hoveredZoneId).toBe(20);
    useResultSelection.getState().clearHoveredZone(20, 'list');
    expect(useResultSelection.getState().hoveredZoneId).toBe(20);
    useResultSelection.getState().clearHoveredZone(20, 'map');
    expect(useResultSelection.getState().hoveredZoneId).toBeNull();
    expect(useResultSelection.getState().hoveredZoneSource).toBeNull();
  });

  it('dims non-results and then every zone except the opened one', () => {
    expect(shouldDimZone(30, null, [10, 20])).toBe(true);
    expect(shouldDimZone(20, null, [10, 20])).toBe(false);
    expect(shouldDimZone(20, 10, [10, 20])).toBe(true);
    expect(shouldDimZone(10, 10, [10, 20])).toBe(false);
  });

  it('gives the hovered result priority over the opened result', () => {
    expect(shouldDimZone(10, 10, [10, 20], 20)).toBe(true);
    expect(shouldDimZone(20, 10, [10, 20], 20)).toBe(false);
    expect(shouldDimCluster([20, 21], 10, [10, 20], 20)).toBe(false);
    expect(shouldDimCluster([10, 11], 10, [10, 20], 20)).toBe(true);
  });

  it('keeps clusters containing a relevant zone emphasized', () => {
    expect(shouldDimCluster([10, 11], null, [11, 20])).toBe(false);
    expect(shouldDimCluster([10, 11], 20, [11, 20])).toBe(true);
  });

  it('allows map hover only for an unclustered search result', () => {
    const singletonIds = new Set([10, 30]);
    expect(canHoverResultZone(10, [10, 20], singletonIds)).toBe(true);
    expect(canHoverResultZone(20, [10, 20], singletonIds)).toBe(false);
    expect(canHoverResultZone(30, [10, 20], singletonIds)).toBe(false);
  });
});
