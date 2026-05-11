// Phase 5 D-03 / RESP-05 unit tests.
// happy-dom (vitest setup) НЕ предоставляет window.visualViewport — мокаем явно.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisualViewportHeight } from './useVisualViewportHeight';

type MockVV = {
  height: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

const ORIGINAL_DESCRIPTOR = Object.getOwnPropertyDescriptor(window, 'visualViewport');

function setVisualViewport(value: MockVV | undefined) {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: true,
    value,
  });
}

function restoreVisualViewport() {
  if (ORIGINAL_DESCRIPTOR) {
    Object.defineProperty(window, 'visualViewport', ORIGINAL_DESCRIPTOR);
  } else {
    setVisualViewport(undefined);
  }
}

beforeEach(() => {
  // Сбрасываем CSS var перед каждым тестом, чтобы сайд-эффект был наблюдаем.
  document.documentElement.style.removeProperty('--keyboard-aware-height');
});

afterEach(() => {
  restoreVisualViewport();
  document.documentElement.style.removeProperty('--keyboard-aware-height');
});

describe('useVisualViewportHeight', () => {
  it('returns visualViewport.height when API available', () => {
    const vv: MockVV = {
      height: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    setVisualViewport(vv);

    const { result } = renderHook(() => useVisualViewportHeight());

    expect(result.current).toBe(600);
    // resize + scroll listeners должны быть подписаны
    expect(vv.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(vv.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('sets CSS variable --keyboard-aware-height on :root after mount', () => {
    const vv: MockVV = {
      height: 720,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    setVisualViewport(vv);

    renderHook(() => useVisualViewportHeight());

    expect(document.documentElement.style.getPropertyValue('--keyboard-aware-height')).toBe(
      '720px',
    );
  });

  it('falls back to window.innerHeight when visualViewport undefined', () => {
    setVisualViewport(undefined);
    // happy-dom defaults innerHeight=768; форсим явное значение
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 540,
    });

    const { result } = renderHook(() => useVisualViewportHeight());

    expect(result.current).toBe(540);
    expect(document.documentElement.style.getPropertyValue('--keyboard-aware-height')).toBe(
      '540px',
    );
  });

  it('cleanup removes listeners on unmount', () => {
    const vv: MockVV = {
      height: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    setVisualViewport(vv);

    const { unmount } = renderHook(() => useVisualViewportHeight());
    unmount();

    expect(vv.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(vv.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
