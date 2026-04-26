// CARD-01 / D-06: Mobile vaul bottom sheet snap [0.4, 0.85].
// Открытие зоны → snap 0.4 (preview); drag-up → 0.85 (full); drag-down → close.
// vaul даёт focus trap + Esc handling из коробки (Radix Dialog inside).
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
import { MapRefContext } from '@/widgets/map-canvas';
import { useRouteId } from '@/widgets/route-preview-summary';
import { ZoneCardContent } from './ZoneCard';

export function MobileZoneCard() {
  const { selectedZoneId, closeCard } = useSelectedZone();
  // Phase 4 / D-28: atomic clear ?route + ?sel при закрытии карточки.
  const { clearRouteId } = useRouteId();
  const handleClose = () => {
    clearRouteId();
    closeCard();
  };
  const [snap, setSnap] = useState<number | string | null>(0.4);
  const isOpen = selectedZoneId != null;
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
    const center = zoneCentroid(zone.geometry);
    try {
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
      snapPoints={[0.4, 0.85]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[95dvh] flex-col rounded-t-2xl bg-white outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Карточка парковки</Drawer.Title>
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
          {renderInactive ? (
            <div role="status" data-testid="mobile-zone-card-inactive" className="p-4">
              <p className="text-sm text-zinc-700">Зона неактивна в этот период</p>
              {mode.kind !== 'now' && (
                <button
                  type="button"
                  onClick={setNow}
                  className="mt-3 inline-flex items-center justify-center rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Вернуться к Сейчас
                </button>
              )}
            </div>
          ) : (
            selectedZoneId != null && (
              <ZoneCardContent key={selectedZoneId} zoneId={selectedZoneId} onClose={handleClose} />
            )
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
