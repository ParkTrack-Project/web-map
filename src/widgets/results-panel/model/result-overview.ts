import type { LngLat, Margin, Projection } from '@yandex/ymaps3-types';

export const RESULTS_OVERVIEW_MIN_ZOOM = 10.5;
export const RESULTS_OVERVIEW_MAX_ZOOM = 15.5;

interface ViewportSize {
  width: number;
  height: number;
}

export interface ResultOverviewLocation {
  center: LngLat;
  zoom: number;
}

/** Fits result centres into the part of the map not covered by mobile UI. */
export function resultOverviewLocation(
  points: readonly LngLat[],
  projection: Projection,
  viewport: ViewportSize,
  margin: Margin,
  minZoom = RESULTS_OVERVIEW_MIN_ZOOM,
  maxZoom = RESULTS_OVERVIEW_MAX_ZOOM,
): ResultOverviewLocation | null {
  if (points.length === 0) return null;
  const world = points.map((point) => projection.toWorldCoordinates(point));
  const xs = world.map(({ x }) => x);
  const ys = world.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const [top, right, bottom, left] = margin;
  const availableWidth = Math.max(1, viewport.width - left - right);
  const availableHeight = Math.max(1, viewport.height - top - bottom);
  const spanX = Math.max(maxX - minX, Number.EPSILON);
  const spanY = Math.max(maxY - minY, Number.EPSILON);
  // World coordinates span two units; pixels per unit are 2 ** (zoom + 7).
  const fitZoom = Math.min(
    Math.log2(availableWidth / spanX) - 7,
    Math.log2(availableHeight / spanY) - 7,
  );
  const zoom = Math.min(maxZoom, Math.max(minZoom, fitZoom));
  const pixelsPerWorldUnit = 2 ** (zoom + 7);
  // Shift the camera towards the covered bottom/right side so the results'
  // midpoint appears in the centre of the actually visible map rectangle.
  const centerX = (minX + maxX) / 2 + (right - left) / 2 / pixelsPerWorldUnit;
  const centerY = (minY + maxY) / 2 - (bottom - top) / 2 / pixelsPerWorldUnit;
  return {
    center: projection.fromWorldCoordinates({ x: centerX, y: centerY }),
    zoom,
  };
}
