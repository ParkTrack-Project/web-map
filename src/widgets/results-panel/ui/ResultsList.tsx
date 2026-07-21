// Phase 4 / RANK-03 / RANK-06 / D-23:
// @tanstack/react-virtual list with fixed-height items 140px.
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RouteCandidate } from '@/entities/zone';
import { RESULTS_LIST_ITEM_HEIGHT_PX } from '@/shared/config';
import { ResultItem } from './ResultItem';
import { useResultsScrollSync } from '../model/useResultsScrollSync';
import { useI18n } from '@/shared/lib/i18n';

interface ResultsListProps {
  candidates: RouteCandidate[];
}

export function ResultsList({ candidates }: ResultsListProps) {
  const { t } = useI18n();
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => RESULTS_LIST_ITEM_HEIGHT_PX,
    overscan: 4,
  });
  useResultsScrollSync(virtualizer, candidates);

  return (
    // data-vaul-no-drag: vaul по умолчанию перехватывает touchmove в Drawer.Content для snap-drag
    // — без этого флага скролл внутри Mobile sheet не работает (touch расценивается как drag-handle).
    // overscroll-behavior:contain — не пробрасываем scroll наверх (на body) при достижении границы.
    <div
      ref={parentRef}
      data-vaul-no-drag
      className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain"
      data-testid="results-list"
    >
      <div
        role="listbox"
        aria-label={t('results.list')}
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const c = candidates[vi.index]!;
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
