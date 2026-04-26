// Phase 4 / RANK-03 / RANK-06 / D-23:
// @tanstack/react-virtual list with fixed-height items 140px.
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RouteCandidate } from '@/entities/zone';
import { RESULTS_LIST_ITEM_HEIGHT_PX } from '@/shared/config';
import { ResultItem } from './ResultItem';
import { useResultsScrollSync } from '../model/useResultsScrollSync';

interface ResultsListProps {
  candidates: RouteCandidate[];
}

export function ResultsList({ candidates }: ResultsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => RESULTS_LIST_ITEM_HEIGHT_PX,
    overscan: 4,
  });
  useResultsScrollSync(virtualizer, candidates);

  return (
    <div ref={parentRef} className="h-full overflow-y-auto" data-testid="results-list">
      <div
        role="listbox"
        aria-label="Парковки в результате поиска"
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const c = candidates[vi.index];
          return (
            <div
              key={c.zone_id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: vi.size,
                transform: `translateY(${vi.start}px)`,
              }}
              className="px-2 py-1"
            >
              <ResultItem candidate={c} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
