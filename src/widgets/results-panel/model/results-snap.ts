export const RESULTS_SNAP_LOW = 0.38;
export const RESULTS_SNAP_HIGH = 0.78;
export const RESULTS_SNAP_MIN = 0.18;

export function clampResultSnap(value: number): number {
  return Math.min(RESULTS_SNAP_HIGH, Math.max(RESULTS_SNAP_MIN, value));
}

export function resultSnapDuringDrag(
  startSnap: number,
  deltaY: number,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0) return clampResultSnap(startSnap);
  return clampResultSnap(startSnap - deltaY / viewportHeight);
}
