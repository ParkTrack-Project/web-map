// Phase 4 / WTP-02..05 / D-11..D-13 / Pitfall 4 (TDD RED):
// Tests for useGeolocationRequest — discriminated state, options, NO call on mount.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocationRequest } from './useGeolocationRequest';

describe('useGeolocationRequest (D-11..D-13 / WTP-02 / Pitfall 4)', () => {
  const getCurrentPositionMock = vi.fn();
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });
    getCurrentPositionMock.mockReset();
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'geolocation');
  });

  it('initial status = idle', () => {
    const { result } = renderHook(() => useGeolocationRequest());
    expect(result.current.state.status).toBe('idle');
  });

  it('success → state.position [lat, lon] + status=success', async () => {
    getCurrentPositionMock.mockImplementationOnce((onSuccess: PositionCallback) =>
      onSuccess({ coords: { latitude: 59.95598, longitude: 30.30943 } } as GeolocationPosition),
    );
    const { result } = renderHook(() => useGeolocationRequest());
    let coords: [number, number] | null = null;
    await act(async () => {
      coords = await result.current.request();
    });
    expect(coords).toEqual([59.95598, 30.30943]);
    await waitFor(() => expect(result.current.state.status).toBe('success'));
  });

  it('PERMISSION_DENIED → status=denied + error message', async () => {
    getCurrentPositionMock.mockImplementationOnce(
      (_: PositionCallback, onError: PositionErrorCallback) =>
        onError({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: 'denied',
        } as GeolocationPositionError),
    );
    const { result } = renderHook(() => useGeolocationRequest());
    await act(async () => {
      await result.current.request();
    });
    expect(result.current.state.status).toBe('denied');
    expect(result.current.state.error).toContain('Геолокация запрещена');
  });

  it('TIMEOUT → status=timeout', async () => {
    getCurrentPositionMock.mockImplementationOnce(
      (_: PositionCallback, onError: PositionErrorCallback) =>
        onError({
          code: 3,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: 'timeout',
        } as GeolocationPositionError),
    );
    const { result } = renderHook(() => useGeolocationRequest());
    await act(async () => {
      await result.current.request();
    });
    expect(result.current.state.status).toBe('timeout');
  });

  it('passes options { enableHighAccuracy:false, timeout:10000, maximumAge:30000 }', async () => {
    getCurrentPositionMock.mockImplementationOnce((onSuccess: PositionCallback) =>
      onSuccess({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition),
    );
    const { result } = renderHook(() => useGeolocationRequest());
    await act(async () => {
      await result.current.request();
    });
    const options = getCurrentPositionMock.mock.calls[0][2];
    expect(options.enableHighAccuracy).toBe(false);
    expect(options.timeout).toBe(10000);
    expect(options.maximumAge).toBe(30000);
  });
});
