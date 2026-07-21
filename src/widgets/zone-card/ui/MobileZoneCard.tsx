// CARD-01 / D-06 / Phase 5 hot-fix: Mobile vaul bottom sheet single-snap [0.92].
// Phase 2 D-06 originally specified snapPoints={[0.4, 0.85]}, но vaul snap math
// требует drawer высотой >= largestSnap × viewport (≥792px на iPhone 14 Pro Max).
// Реальный content (header+tags+button ~408px) намного меньше → vaul применяет
// transform translateY(559px) который пушит drawer ENTIRELY off-screen (карточка
// не видна вообще). Тот же баг был в Phase 4 MobileResultsSheet → решился single-
// snap [0.92] (CO-02). Применяем тот же pattern: drawer открывается на 92% экрана,
// drag-down dismiss; preview-режим [0.4] deferred to v1.x design pass.
//
// CARD-07 mobile (D-07): при open зоны карта слегка панорамируется вверх
// (offset -20% от viewport height) с easing 300ms — чтобы зона не оказалась под
// bottom sheet'ом. mapRef получаем из MapRefContext, экспонированного MapCanvas.
// Если mapRef ещё null (mapCanvas не смонтирован) — pan тихо пропускается.
//
// Pixel-precision -20% (через map.projection.toPixel/fromPixel) — Phase 5 polish;
// текущая реализация центрирует на зоне с easing 300ms (уже устраняет 90% «зона
// под sheet'ом» проблемы, потому что центр зоны попадает в верхнюю половину
// видимой над sheet'ом области).
import { useContext, useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { useSelectedZone } from '@/features/select-zone';
import { useTimeMode } from '@/features/select-time-mode';
import { useZoneByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useIsMobile } from '@/shared/lib/responsive';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { MapRefContext } from '@/widgets/map-canvas';
import { useRouteId } from '@/widgets/route-preview-summary';
import { ZoneCardContent } from './ZoneCard';
import { useI18n } from '@/shared/lib/i18n';

export function MobileZoneCard() {
  const { t } = useI18n();
  // Phase 5 D-03: keyboard-aware sizing — ZoneCardContent сам по себе input'ов
  // не имеет, но карточка может остаться открытой пока user typing в SearchBar
  // overlay (z=55 поверх). visualViewport-aware max-height гарантирует, что
  // sheet content не уходит под keyboard.
  useVisualViewportHeight();
  const { selectedZoneId, closeCard } = useSelectedZone();
  // Phase 4 / D-28: atomic clear ?route + ?sel при закрытии карточки.
  const { clearRouteId } = useRouteId();
  const handleClose = () => {
    clearRouteId();
    closeCard();
  };
  // КРИТИЧНО: vaul Drawer.Root рендерит Portal в body и применяет
  // `pointer-events: none` + `aria-hidden=true` ко ВСЕМУ остальному DOM.
  // Гейт isMobile защищает desktop.
  const isMobile = useIsMobile();
  // Race-fix: при click на ResultItem MobileResultsSheet начинает close-animation (~500ms vaul).
  // Если MobileZoneCard.Drawer.Root mountится сразу — два body lock'а одновременно,
  // второй Drawer не получает focus и зрительно «пропадает». Ждём cleanup первого.
  const wantsOpen = isMobile && selectedZoneId != null;
  const [delayedOpen, setDelayedOpen] = useState(false);
  useEffect(() => {
    if (wantsOpen) {
      // 600ms — превышает vaul Drawer.Content close transition (CSS 0.5s cubic-bezier).
      // 350ms раньше было недостаточно: vaul body lock не успевал освободиться.
      const t = setTimeout(() => setDelayedOpen(true), 600);
      return () => clearTimeout(t);
    }
    setDelayedOpen(false);
    return;
  }, [wantsOpen]);
  const isOpen = delayedOpen;
  const mapRefHolder = useContext(MapRefContext);

  // Plan 05 / TIME-07: mode → useZoneByIdQuery (тот же key, что и в ZoneCardContent
  // — TanStack Query дедуплицирует, один реальный fetch). При смене mode оба
  // компонента переходят на новый queryKey и получают новые данные синхронно.
  const { mode, setNow } = useTimeMode();
  const { data: zone } = useZoneByIdQuery(selectedZoneId, mode);

  // CARD-07 mobile: panorama -20% viewport вверх через ymaps3 setLocation.
  // duration: 300 — мягкая анимация без jump-эффекта (D-07 mobile half).
  // Plan 05 / TIME-07: skip pan для is_active === false — нет смысла центрировать
  // зону, которая «неактивна в этот период» (карточка покажет inactive empty-state).
  useEffect(() => {
    if (!isOpen || !zone || !mapRefHolder?.current) return;
    if (zone.is_active === false) return;
    if (!zone.geometry?.coordinates?.[0]?.length) {
      console.warn('[ptk] mobile pan skipped: zone geometry is missing', {
        selectedZoneId,
        zone,
      });
      return;
    }

    const center = zoneCentroid(zone.geometry);

    try {
      // Pan-only (центр, без zoom): приближение при ВЫБОРЕ зоны делает общий
      // useZoomToZone в обработчике клика (по карте и в списке). Если ставить
      // здесь ещё и фиксированный zoom, он перетёр бы относительный зум клика
      // (откатывал бы к 18). Эта карточка лишь до-центрирует зону над sheet'ом.
      mapRefHolder.current.setLocation({
        center,
        duration: 300, // ms — easing 300ms (D-07 mobile)
      });
      console.debug('[ptk] mobile pan to zone', selectedZoneId);
    } catch (e) {
      console.warn('[ptk] mobile pan failed:', e);
    }
  }, [isOpen, zone, mapRefHolder, selectedZoneId]);

  // Plan 05 / D-16: inactive zone → render mobile-specific empty-state ВМЕСТО
  // полной ZoneCardContent. ZoneCardContent тоже умеет показывать inactive, но для
  // mobile показываем сжатый layout (без header/Spinner/etc.) внутри Drawer.
  // Mirror'ит pattern desktop ZoneCard — D-16 «Зона неактивна в этот период».
  const renderInactive = zone && zone.is_active === false;

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="surface-opaque fixed inset-x-0 bottom-0 z-50 mx-auto flex flex-col rounded-t-2xl bg-white outline-none lg:hidden dark:bg-zinc-900"
          aria-describedby={undefined}
          // Phase 5 hot-fix: drawer auto-fit to content height (без snapPoints).
          // pb-[15px] добавляет 15px отступа после кнопки «Построить маршрут» —
          // user-requested whitespace under primary CTA. max-height ограничивает
          // экстремальные случаи (длинные адреса) до safe-area viewport.
          style={{ maxHeight: 'calc(var(--keyboard-aware-height, 100dvh) - 80px)' }}
        >
          <Drawer.Title className="sr-only">{t('zone.card')}</Drawer.Title>
          <div className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300" aria-hidden />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[15px]">
            {renderInactive ? (
              <div role="status" data-testid="mobile-zone-card-inactive" className="p-4">
                <p className="text-sm text-zinc-700">{t('zone.inactive')}</p>
                {mode.kind !== 'now' && (
                  <button
                    type="button"
                    onClick={setNow}
                    className="mt-3 inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    {t('time.returnNow')}
                  </button>
                )}
              </div>
            ) : (
              selectedZoneId != null && (
                <ZoneCardContent
                  key={selectedZoneId}
                  zoneId={selectedZoneId}
                  onClose={handleClose}
                />
              )
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
