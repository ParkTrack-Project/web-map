// Phase 4 / SEARCH-04 / D-05:
// Mobile top-bar input. Focus → full-screen overlay (NO vaul — Pitfall 11 nested Drawer
// — используем simple absolute-positioned overlay, не конкурирует с ZoneCard/Results sheet'ами).
// tap-targets ≥ 44px (h-11), inputMode="search".
//
// Fix 2026-05-26: используем `sug.coords` напрямую (см. DesktopSearchBar для
// объяснения — повторный resolve по title без региона уводил адрес в чужой город).
import { useContext, useRef, useState } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { useAddressSuggest, useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFromCoords } from '@/features/request-geolocation';
import { MapRefContext } from '@/widgets/map-canvas';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import type { SuggestResult } from '@/shared/lib/yandex';
import { SuggestionsList } from './SuggestionsList';
import { useI18n } from '@/shared/lib/i18n';
import { originForAddressSelection } from '../model/search-origin';

export function MobileSearchBar() {
  const { t } = useI18n();
  // Phase 5 D-03 (RESP-05): главный driver — search input открывает on-screen
  // keyboard, suggestions list ниже него должен помещаться в visible-viewport.
  // Side-effect устанавливает --keyboard-aware-height на :root; suggestions
  // wrapper ниже читает её через CSS calc().
  useVisualViewportHeight();
  const { text, setText, results, isFetching, error } = useAddressSuggest();
  const { setDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const { from, setFromCoords } = useFromCoords();
  const mapRef = useContext(MapRefContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const onSelect = (sug: SuggestResult) => {
    if (!sug.coords) return;
    const coords = sug.coords;
    setDestination(coords);
    const addressOrigin = originForAddressSelection(from, coords);
    if (addressOrigin) setFromCoords(addressOrigin);
    mapRef?.current?.setLocation({ center: [coords[1], coords[0]], zoom: 16, duration: 300 });
    closeCard();
    setText(sug.title.text);
    inputRef.current?.blur(); // SEARCH-04: клавиатура закрывается
    setOverlayOpen(false);
  };

  // Top-bar (всегда видим). right-14 = 56px — место для круглой FiltersFAB (44px) + 12px gap.
  const topBar = (
    <div className="absolute top-2 right-14 left-2 z-30 flex items-center gap-2 lg:hidden">
      <div className="relative flex flex-1 items-center">
        <Search size={14} aria-hidden className="absolute left-3 text-zinc-400" />
        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label={t('search.placeholder')}
          placeholder={t('search.placeholder')}
          inputMode="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOverlayOpen(true)}
          className="h-11 w-full rounded-full border border-zinc-200 bg-white pr-9 pl-9 text-sm shadow-sm focus:outline-none"
          autoComplete="off"
        />
      </div>
    </div>
  );

  // Full-screen overlay при focus (D-05). Phase 5 D-03: keyboard-aware height —
  // suggestions list внутри scroll-container получает honest visible-viewport.
  const overlay = overlayOpen ? (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-white lg:hidden"
      style={{ height: 'var(--keyboard-aware-height, 100dvh)' }}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2">
        <button
          type="button"
          onClick={() => setOverlayOpen(false)}
          aria-label={t('search.close')}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <div className="relative flex flex-1 items-center">
          <Search size={14} aria-hidden className="absolute left-3 text-zinc-400" />
          <input
            type="search"
            aria-label={t('search.placeholder')}
            placeholder={t('search.placeholder')}
            inputMode="search"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-11 w-full rounded-full border border-zinc-200 bg-white pr-9 pl-9 text-sm focus:outline-none"
            autoComplete="off"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText('')}
              aria-label={t('search.clear')}
              className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isFetching && (
          <div role="status" className="px-4 py-3 text-sm text-zinc-500">
            {t('common.loading')}
          </div>
        )}
        <SuggestionsList results={results} onSelect={onSelect} error={error} />
      </div>
    </div>
  ) : null;

  return (
    <>
      {topBar}
      {overlay}
    </>
  );
}
