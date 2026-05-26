// Phase 4 / SEARCH-01..03 / D-04 / D-07:
// Desktop search input — компактная ширина 360px, расширяется до 480px на focus.
// На mount — НЕ вызывает Yandex API (use-debounce; min length 2).
// Click outside — закрывает popover (radix Popover handles).
//
// D-07: одновременные side-effects ВНУТРИ одного onSelect handler:
//   (1) setDestination URL ?dest (→ маркер адреса на карте)
//   (2) map.setLocation centering (lon-lat order!)
//   (3) closeCard (?sel=null)
//   (4) blur input + close popover
//   (5) открыть окно «Где припарковаться?» (если ?from ещё нет)
//
// Fix 2026-05-26: координаты берём из `sug.coords` (их кладёт ymaps3.search в
// suggestAddresses). Раньше делался повторный resolve по `sug.uri`, в котором
// лежал ТОЛЬКО title (без региона из subtitle) → Yandex без региона возвращал
// первый попавшийся объект (напр. «Ломоносова 9 СПб» уезжал в В. Новгород).
import { useContext, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search, X } from 'lucide-react';
import { useAddressSuggest, useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFromCoords } from '@/features/request-geolocation';
import { useWtpPrompt } from '@/widgets/wtp-cta';
import { MapRefContext } from '@/widgets/map-canvas';
import type { SuggestResult } from '@/shared/lib/yandex';
import { SuggestionsList } from './SuggestionsList';

export function DesktopSearchBar() {
  const { text, setText, results, isFetching, error } = useAddressSuggest();
  const { setDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const { from } = useFromCoords();
  const openWtpPrompt = useWtpPrompt((s) => s.setOpen);
  const mapRef = useContext(MapRefContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // D-07: одновременные side-effects ВНУТРИ одного handler — НЕ через useEffect chains.
  const onSelectSuggestion = (sug: SuggestResult) => {
    // suggestAddresses гарантирует coords для каждого hit (ymaps3.search отдаёт
    // их сразу). Guard на случай будущего источника подсказок без координат.
    if (!sug.coords) return;
    const coords = sug.coords; // [lat, lon]
    // 1. setDestination — URL ?dest (→ розовый маркер адреса на карте)
    setDestination(coords);
    // 2. center map (lon-lat order для Yandex setLocation)
    mapRef?.current?.setLocation({ center: [coords[1], coords[0]], zoom: 16, duration: 300 });
    // 3. close zone-card
    closeCard();
    // 4. blur input + close popover
    inputRef.current?.blur();
    setOpen(false);
    setText(sug.title.text);
    // 5. Quick-fix 2026-05-16: сразу предлагаем указать стартовую точку —
    //    открываем окно «Где припарковаться?». Только если ?from ещё нет:
    //    при известном origin результаты и так открываются автоматически,
    //    лишнее модальное окно не показываем.
    if (!from) openWtpPrompt(true);
  };

  return (
    // Fix 2026-05-16: open был завязан на наличие results → во время 300ms
    // debounce popover схлопывался («появляется и сразу пропадает»). Теперь
    // открыт пока инпут в фокусе; контент сам показывает loading/подсказки/ошибку.
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div ref={anchorRef} className="relative flex items-center">
          <Search size={14} aria-hidden className="absolute left-3 text-zinc-400" />
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label="Где искать парковку?"
            placeholder="Где искать парковку?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-9 w-[420px] rounded-full border border-zinc-200 bg-white pr-9 pl-9 text-sm shadow-sm focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 focus:outline-none"
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
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Fix 2026-05-16: инпут лежит в Anchor (вне Content) и Trigger'а нет,
        // поэтому Radix считал клик/фокус в поле «interact outside» и закрывал
        // popover — гонка с onFocus давала «список через раз». Исключаем сам
        // блок поиска из outside-закрытия; клики реально снаружи закрывают как и были.
        onInteractOutside={(e) => {
          const t = e.detail.originalEvent.target as Node | null;
          if (t && anchorRef.current?.contains(t)) e.preventDefault();
        }}
        className="z-50 w-[480px] rounded-xl border border-zinc-200 bg-white shadow-md outline-none"
      >
        {isFetching && (
          <div role="status" className="px-3 py-2 text-xs text-zinc-500">
            Загрузка…
          </div>
        )}
        <SuggestionsList results={results} onSelect={onSelectSuggestion} error={error} />
      </Popover.Content>
    </Popover.Root>
  );
}
