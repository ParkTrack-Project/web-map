export const RESULTS_SNAP_LOW = 0.38;
export const RESULTS_SNAP_HIGH = 0.92;

const DRAG_THRESHOLD_PX = 48;

export function resultSnapAfterDrag(current: number, deltaY: number): number {
  if (deltaY >= DRAG_THRESHOLD_PX) return RESULTS_SNAP_LOW;
  if (deltaY <= -DRAG_THRESHOLD_PX) return RESULTS_SNAP_HIGH;
  return current;
}
