import { describe, expect, it } from 'vitest';
import {
  RESULTS_SNAP_HIGH,
  RESULTS_SNAP_LOW,
  RESULTS_SNAP_MIN,
  clampResultSnap,
  resultSnapDuringDrag,
} from './results-snap';

describe('resultSnapDuringDrag', () => {
  it('follows a downward drag continuously', () => {
    expect(resultSnapDuringDrag(0.6, 80, 800)).toBeCloseTo(0.5);
  });

  it('follows an upward drag continuously', () => {
    expect(resultSnapDuringDrag(RESULTS_SNAP_LOW, -80, 800)).toBeCloseTo(RESULTS_SNAP_LOW + 0.1);
  });

  it('clamps the panel to its usable range', () => {
    expect(resultSnapDuringDrag(RESULTS_SNAP_MIN, 500, 800)).toBe(RESULTS_SNAP_MIN);
    expect(resultSnapDuringDrag(RESULTS_SNAP_HIGH, -500, 800)).toBe(RESULTS_SNAP_HIGH);
  });
});

describe('clampResultSnap', () => {
  it('keeps arbitrary intermediate heights', () => {
    expect(clampResultSnap(0.57)).toBe(0.57);
  });
});
