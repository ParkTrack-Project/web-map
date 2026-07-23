import { describe, expect, it } from 'vitest';
import {
  isPointInsideMapBounds,
  resolveZoneCameraCenter,
  shouldUpdateHoverCamera,
} from './zone-camera';

const bounds: [[number, number], [number, number]] = [
  [30, 59],
  [31, 60],
];

describe('zone camera', () => {
  it('keeps the current center when the hovered result is already visible', () => {
    expect(resolveZoneCameraCenter([30.8, 59.8], [30.5, 59.5], bounds, 'if-outside')).toEqual([
      30.5, 59.5,
    ]);
  });

  it('centers an off-screen hovered result', () => {
    expect(resolveZoneCameraCenter([32, 61], [30.5, 59.5], bounds, 'if-outside')).toEqual([32, 61]);
  });

  it('accepts bounds regardless of their corner order', () => {
    expect(
      isPointInsideMapBounds(
        [30.5, 59.5],
        [
          [31, 60],
          [30, 59],
        ],
      ),
    ).toBe(true);
  });

  it('does not touch the camera when the standalone counter is already visible', () => {
    expect(shouldUpdateHoverCamera(true, true, 15, 14)).toBe(false);
    expect(shouldUpdateHoverCamera(false, true, 15, 14)).toBe(true);
    expect(shouldUpdateHoverCamera(true, false, 15, 14)).toBe(true);
    expect(shouldUpdateHoverCamera(true, true, 13, 14)).toBe(true);
  });
});
