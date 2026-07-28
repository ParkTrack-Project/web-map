import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileResultsSheet } from './MobileResultsSheet';

const clearFromCoords = vi.fn();
const clearDestination = vi.fn();
const closeCard = vi.fn();

vi.mock('@/features/request-geolocation', () => ({
  useFromCoords: () => ({ from: [30.3, 59.9], clearFromCoords }),
}));
vi.mock('@/features/address-search', () => ({
  useDestination: () => ({ dest: null, clearDestination }),
}));
vi.mock('@/features/select-zone', () => ({
  useSelectedZone: () => ({ selectedZoneId: null, closeCard }),
}));
vi.mock('@/features/filter-zones', () => ({
  useFilters: () => ({ activeCount: 0, resetAll: vi.fn() }),
  useFilteredCandidates: (candidates: unknown[] | undefined) => candidates ?? [],
}));
vi.mock('@/shared/lib/responsive', () => ({ useIsMobile: () => true }));
vi.mock('@/shared/lib/dom', () => ({ useVisualViewportHeight: () => 800 }));
vi.mock('@/shared/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('@/shared/ui', () => ({ Spinner: () => null }));
vi.mock('../model/useRoutingResults', () => ({
  useRoutingResults: () => ({
    data: { candidates: [], total_candidates: 0 },
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('./EmptyResultsState', () => ({ EmptyResultsState: () => null }));
vi.mock('./ResultsList', () => ({ ResultsList: () => null }));

describe('MobileResultsSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  it('changes height continuously when dragged by the title area', () => {
    const onSnapPointChange = vi.fn();
    render(
      <MobileResultsSheet
        open
        onOpenChange={vi.fn()}
        snapPoint={0.4}
        onSnapPointChange={onSnapPointChange}
      />,
    );

    const title = screen.getByRole('heading', { name: /results\.near/ });
    fireEvent.pointerDown(title, { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(title, { clientY: 320, pointerId: 1 });

    expect(screen.getByTestId('mobile-results-sheet')).toHaveStyle({
      height: 'min(50dvh, calc(var(--keyboard-aware-height, 100dvh) - 80px))',
    });
    expect(onSnapPointChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(title, { clientY: 320, pointerId: 1 });
    expect(onSnapPointChange).toHaveBeenLastCalledWith(0.5);
  });

  it('keeps the close button independent from the drag region', () => {
    const onOpenChange = vi.fn();
    const onSnapPointChange = vi.fn();
    render(
      <MobileResultsSheet
        open
        onOpenChange={onOpenChange}
        snapPoint={0.4}
        onSnapPointChange={onSnapPointChange}
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'results.close' }), {
      clientY: 400,
      pointerId: 1,
    });
    fireEvent.pointerMove(screen.getByTestId('mobile-results-drag-region'), {
      clientY: 320,
      pointerId: 1,
    });
    fireEvent.click(screen.getByRole('button', { name: 'results.close' }));

    expect(onSnapPointChange).not.toHaveBeenCalled();
    expect(clearFromCoords).toHaveBeenCalledOnce();
    expect(clearDestination).toHaveBeenCalledOnce();
    expect(closeCard).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
