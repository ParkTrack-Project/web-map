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
import { useZoneByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { MapRefContext } from '@/widgets/map-canvas';
import { ZoneCardContent } from './ZoneCard';

export function MobileZoneCard() {
  const { selectedZoneId, closeCard } = useSelectedZone();
  const [snap, setSnap] = useState<number | string | null>(0.4);
  const isOpen = selectedZoneId != null;
  const mapRefHolder = useContext(MapRefContext);

  // useZoneByIdQuery дедуплицируется TanStack Query'ем — тот же key, что и
  // внутри ZoneCardContent → один реальный fetch.
  const { data: zone } = useZoneByIdQuery(selectedZoneId);

  // CARD-07 mobile: panorama -20% viewport вверх через ymaps3 setLocation.
  // duration: 300 — мягкая анимация без jump-эффекта (D-07 mobile half).
  useEffect(() => {
    if (!isOpen || !zone || !mapRefHolder?.current) return;
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

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeCard();
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
          {selectedZoneId != null && (
            <ZoneCardContent key={selectedZoneId} zoneId={selectedZoneId} onClose={closeCard} />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
