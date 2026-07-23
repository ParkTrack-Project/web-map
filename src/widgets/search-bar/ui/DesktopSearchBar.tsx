import { useContext, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search, X } from 'lucide-react';
import { useAddressSuggest, useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFromCoords, useGeolocationRequest } from '@/features/request-geolocation';
import { MapRefContext } from '@/widgets/map-canvas';
import { GeolocationDeniedBanner } from '@/widgets/wtp-cta';
import type { SuggestResult } from '@/shared/lib/yandex';
import { SuggestionsList } from './SuggestionsList';
import { useI18n } from '@/shared/lib/i18n';

export function DesktopSearchBar() {
  const { t } = useI18n();
  const { text, setText, results, isFetching, error } = useAddressSuggest();
  const { setDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const { from, setFromCoords } = useFromCoords();
  const geolocation = useGeolocationRequest();
  const mapRef = useContext(MapRefContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const onSelectSuggestion = (sug: SuggestResult) => {
    // suggestAddresses гарантирует coords для каждого hit (ymaps3.search отдаёт
    // их сразу). Guard на случай будущего источника подсказок без координат.
    if (!sug.coords) return;
    const coords = sug.coords; // [lat, lon]
    // 1. setDestination — URL ?dest (→ розовый маркер адреса на карте)
    setDestination(coords);
    // Поиск парковок всегда строится от пользователя. Если origin ещё не
    // известен, выбор адреса сам запрашивает геолокацию и запускает запрос
    // сразу после получения координат.
    if (!from) {
      void geolocation.request().then((position) => {
        if (position) setFromCoords(position);
      });
    }
    mapRef?.current?.setLocation({ center: [coords[1], coords[0]], zoom: 16, duration: 300 });
    closeCard();
    inputRef.current?.blur();
    setOpen(false);
    setText(sug.title.text);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div ref={anchorRef} className="relative flex items-center">
          <Search size={14} aria-hidden className="absolute left-3 text-zinc-400" />
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label={t('search.placeholder')}
            placeholder={t('search.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-9 w-[420px] rounded-full border border-zinc-200 bg-white pr-9 pl-9 text-sm shadow-sm focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 focus:outline-none"
            autoComplete="off"
          />
          {text && (
            <button
              type="button"
              aria-label={t('search.clear')}
              onClick={() => {
                setText('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={14} aria-hidden />
            </button>
          )}
          <GeolocationDeniedBanner
            state={geolocation.state}
            className="absolute top-11 left-0 w-full"
          />
        </div>
      </Popover.Anchor>
      <Popover.Content
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const t = e.detail.originalEvent.target as Node | null;
          if (t && anchorRef.current?.contains(t)) e.preventDefault();
        }}
        className="z-50 w-[480px] rounded-xl border border-zinc-200 bg-white shadow-md outline-none"
      >
        {isFetching && (
          <div role="status" className="px-3 py-2 text-xs text-zinc-500">
            {t('common.loading')}
          </div>
        )}
        <SuggestionsList results={results} onSelect={onSelectSuggestion} error={error} />
      </Popover.Content>
    </Popover.Root>
  );
}
