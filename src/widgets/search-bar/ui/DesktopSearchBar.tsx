// Phase 4 / SEARCH-01..03 / D-04 / D-07:
// Desktop search input — компактная ширина 360px, расширяется до 480px на focus.
// На mount — НЕ вызывает Yandex API (use-debounce; min length 2).
// Click outside — закрывает popover (radix Popover handles).
//
// D-07: 4 одновременных side-effects ВНУТРИ одного onSelect handler:
//   (1) setDestination URL ?dest
//   (2) map.setLocation centering (lon-lat order!)
//   (3) closeCard (?sel=null)
//   (4) blur input + close popover
import { useContext, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search, X } from 'lucide-react';
import {
  useAddressSuggest,
  useResolveCoordinates,
  useDestination,
} from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { MapRefContext } from '@/widgets/map-canvas';
import type { SuggestResult } from '@/shared/lib/yandex';
import { SuggestionsList } from './SuggestionsList';

export function DesktopSearchBar() {
  const { text, setText, results, isFetching, error } = useAddressSuggest();
  const { resolve, isPending: isResolving } = useResolveCoordinates();
  const { setDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const mapRef = useContext(MapRefContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  // D-07: 4 одновременных side-effects ВНУТРИ одного handler — НЕ через useEffect chains.
  const onSelectSuggestion = async (sug: SuggestResult) => {
    if (!sug.uri) return;
    try {
      const coords = await resolve(sug.uri); // [lat, lon]
      // 1. setDestination — URL ?dest
      setDestination(coords);
      // 2. center map (lon-lat order для Yandex setLocation)
      mapRef?.current?.setLocation({ center: [coords[1], coords[0]], zoom: 16, duration: 300 });
      // 3. close zone-card
      closeCard();
      // 4. blur input + close popover
      inputRef.current?.blur();
      setOpen(false);
      setText(sug.title.text);
    } catch (e) {
      console.warn('[search] geocode failed:', e);
    }
  };

  return (
    <Popover.Root
      open={open && (results.length > 0 || isFetching || !!error || text.length === 0)}
      onOpenChange={setOpen}
    >
      <Popover.Anchor asChild>
        <div className="relative flex items-center">
          <Search size={14} aria-hidden className="absolute left-3 text-zinc-400" />
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label="Поиск адреса"
            placeholder="Поиск адреса"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-9 w-[360px] rounded-full border border-zinc-200 bg-white pr-9 pl-9 text-sm shadow-sm focus:w-[480px] focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 focus:outline-none"
            autoComplete="off"
          />
          {text && (
            <button
              type="button"
              aria-label="Очистить поиск"
              onClick={() => {
                setText('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 rounded-full p-1 hover:bg-zinc-100"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </Popover.Anchor>
      <Popover.Content
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="z-50 w-[480px] rounded-xl border border-zinc-200 bg-white shadow-md outline-none"
      >
        {(isFetching || isResolving) && (
          <div role="status" className="px-3 py-2 text-xs text-zinc-500">
            Загрузка…
          </div>
        )}
        <SuggestionsList results={results} onSelect={onSelectSuggestion} error={error} />
      </Popover.Content>
    </Popover.Root>
  );
}
