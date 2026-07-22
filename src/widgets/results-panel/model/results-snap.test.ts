import { describe, expect, it } from 'vitest';
import { RESULTS_SNAP_HIGH, RESULTS_SNAP_LOW, resultSnapAfterDrag } from './results-snap';

describe('resultSnapAfterDrag', () => {
  it('collapses after a downward drag', () => {
    expect(resultSnapAfterDrag(RESULTS_SNAP_HIGH, 70)).toBe(RESULTS_SNAP_LOW);
  });

  it('expands after an upward drag', () => {
    expect(resultSnapAfterDrag(RESULTS_SNAP_LOW, -70)).toBe(RESULTS_SNAP_HIGH);
  });

  it('keeps the current position after a short gesture', () => {
    expect(resultSnapAfterDrag(RESULTS_SNAP_LOW, 20)).toBe(RESULTS_SNAP_LOW);
  });
});
