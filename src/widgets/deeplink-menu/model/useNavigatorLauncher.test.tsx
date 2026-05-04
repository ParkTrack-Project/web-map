// Phase 4 / ROUTE-07 / D-33:
// useNavigatorLauncher unit tests — coordinate validation, yandexnavi:// scheme,
// timer-fallback после 2500ms, window.open для maps web и google maps.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigatorLauncher } from './useNavigatorLauncher';

describe('useNavigatorLauncher (ROUTE-07 / D-33)', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '' },
      writable: true,
      configurable: true,
    });
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });
  afterEach(() => {
    vi.useRealTimers();
    openSpy.mockRestore();
  });

  it('valid coords → navigates to yandexnavi://', () => {
    const { result } = renderHook(() => useNavigatorLauncher());
    result.current.launchYandexNavigator([59.93, 30.31], [59.95, 30.3]);
    expect(window.location.href).toMatch(/^yandexnavi:\/\/build_route_on_map/);
  });

  it('invalid coords → no navigation', () => {
    const { result } = renderHook(() => useNavigatorLauncher());
    const before = window.location.href;
    result.current.launchYandexNavigator([91.0, 30.31], [59.95, 30.3]);
    expect(window.location.href).toBe(before);
  });

  it('no visibilitychange → fallback web after 2500ms', () => {
    const { result } = renderHook(() => useNavigatorLauncher());
    result.current.launchYandexNavigator([59.93, 30.31], [59.95, 30.3]);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    vi.advanceTimersByTime(2600);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/yandex\.ru\/maps/),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('launchYandexMapsWeb → window.open', () => {
    const { result } = renderHook(() => useNavigatorLauncher());
    result.current.launchYandexMapsWeb([59.93, 30.31], [59.95, 30.3]);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('yandex.ru/maps'),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('launchGoogleMaps → window.open', () => {
    const { result } = renderHook(() => useNavigatorLauncher());
    result.current.launchGoogleMaps([59.93, 30.31], [59.95, 30.3]);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
