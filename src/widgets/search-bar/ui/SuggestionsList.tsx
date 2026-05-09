// Phase 4 / SEARCH-02 / D-06:
// ARIA-listbox с keyboard navigation. Highlight'ит совпадение через hl ranges от Yandex.
// Empty/error — D-06 / SEARCH-05 текст.
import type { ReactNode } from 'react';
import type { SuggestResult } from '@/shared/lib/yandex';

interface SuggestionsListProps {
  results: SuggestResult[];
  onSelect: (suggestion: SuggestResult) => void;
  error?: unknown;
}

function HighlightedTitle({ title }: { title: SuggestResult['title'] }) {
  const text = title.text;
  const hl = title.hl ?? [];
  if (hl.length === 0) return <span>{text}</span>;
  const segs: ReactNode[] = [];
  let cursor = 0;
  hl.forEach((h, i) => {
    if (h.begin > cursor) segs.push(<span key={`pre-${i}`}>{text.slice(cursor, h.begin)}</span>);
    segs.push(
      <mark key={`hl-${i}`} className="bg-emerald-100 text-inherit">
        {text.slice(h.begin, h.end)}
      </mark>,
    );
    cursor = h.end;
  });
  if (cursor < text.length) segs.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{segs}</>;
}

export function SuggestionsList({ results, onSelect, error }: SuggestionsListProps) {
  if (error) {
    return (
      <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        Яндекс Search недоступен, попробуйте позже
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <div role="status" className="px-3 py-2 text-sm text-zinc-500">
        Начните вводить адрес
      </div>
    );
  }
  return (
    <ul role="listbox" aria-label="Подсказки адресов" className="max-h-[400px] overflow-y-auto">
      {results.map((sug, idx) => (
        <li
          key={sug.uri ?? idx}
          role="option"
          aria-selected={false}
          tabIndex={0}
          onClick={() => onSelect(sug)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSelect(sug);
          }}
          className="cursor-pointer truncate px-3 py-2 text-sm hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
        >
          <div className="truncate font-medium">
            <HighlightedTitle title={sug.title} />
          </div>
          {sug.subtitle?.text && (
            <div className="truncate text-xs text-zinc-500">{sug.subtitle.text}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
