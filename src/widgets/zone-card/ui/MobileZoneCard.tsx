import { useContext, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Drawer } from 'vaul';
import { useResultSelection, useSelectedZone } from '@/features/select-zone';
import { useTimeMode } from '@/features/select-time-mode';
import { useZoneByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useIsMobile } from '@/shared/lib/responsive';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { MapRefContext } from '@/widgets/map-canvas';
import { useRouteId } from '@/widgets/route-preview-summary';
import { ZoneCardContent } from './ZoneCard';
import { useI18n } from '@/shared/lib/i18n';
import { mobileZoneMapCenter } from '../model/mobile-zone-center';

interface MobileZoneCardProps {
  onBackToResults?: () => void;
}

const MOBILE_ZONE_CARD_MIN_HEIGHT = 112;

export function MobileZoneCard({ onBackToResults }: MobileZoneCardProps) {
  const { t } = useI18n();
  useVisualViewportHeight();
  const { selectedZoneId, closeCard } = useSelectedZone();
  const { clearRouteId } = useRouteId();
  const handleClose = () => {
    clearRouteId();
    closeCard();
  };
  // КРИТИЧНО: vaul Drawer.Root рендерит Portal в body и применяет
  // `pointer-events: none` + `aria-hidden=true` ко ВСЕМУ остальному DOM.
  // Гейт isMobile защищает desktop.
  const isMobile = useIsMobile();
  const wantsOpen = isMobile && selectedZoneId != null;
  const isOpen = wantsOpen;
  const resultZoneIds = useResultSelection((state) => state.resultZoneIds);
  const canReturnToResults =
    selectedZoneId !== null && resultZoneIds.includes(selectedZoneId) && !!onBackToResults;
  const mapRefHolder = useContext(MapRefContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const expandedHeight = useRef(0);
  const pointerStartY = useRef<number | null>(null);
  const pointerStartHeight = useRef(0);
  const latestDragHeight = useRef(0);

  const { mode } = useTimeMode();
  const { data: zone } = useZoneByIdQuery(selectedZoneId, mode);

  const centerZoneAboveCard = (sheetHeight: number, duration: number) => {
    const map = mapRefHolder?.current;
    if (!map || !zone || zone.is_active === false || !zone.geometry?.coordinates?.[0]?.length)
      return;

    try {
      map.setLocation({
        center: mobileZoneMapCenter(
          zoneCentroid(zone.geometry),
          map.zoom,
          sheetHeight,
          map.projection,
        ),
        duration,
      });
    } catch (error) {
      console.warn('[ptk] mobile pan failed:', error);
    }
  };

  const setCardHeight = (height: number, duration = 0) => {
    if (!contentRef.current) return;
    contentRef.current.style.height = `${height}px`;
    latestDragHeight.current = height;
    document.documentElement.style.setProperty('--bottom-sheet-offset', `${height + 20}px`);
    centerZoneAboveCard(height, duration);
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const height = contentRef.current?.getBoundingClientRect().height ?? 0;
    if (height <= 0) return;
    expandedHeight.current = Math.max(expandedHeight.current, height);
    pointerStartY.current = event.clientY;
    pointerStartHeight.current = height;
    latestDragHeight.current = height;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null || expandedHeight.current <= 0) return;
    const requestedHeight = pointerStartHeight.current - (event.clientY - pointerStartY.current);
    const minHeight = Math.min(MOBILE_ZONE_CARD_MIN_HEIGHT, expandedHeight.current);
    const nextHeight = Math.min(expandedHeight.current, Math.max(minHeight, requestedHeight));
    setCardHeight(nextHeight);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null) return;
    pointerStartY.current = null;
    centerZoneAboveCard(latestDragHeight.current, 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    expandedHeight.current = 0;
    pointerStartY.current = null;
    if (contentRef.current) contentRef.current.style.removeProperty('height');
  }, [selectedZoneId]);

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

    const zoneCenter = zoneCentroid(zone.geometry);
    // Selection zoom animates for 300 ms. Re-centre only once after that
    // animation and after Vaul has measured its content; subsequent user pans
    // must remain untouched.
    const timeout = window.setTimeout(() => {
      const map = mapRefHolder.current;
      const sheetHeight = contentRef.current?.getBoundingClientRect().height ?? 0;
      if (!map) return;
      expandedHeight.current = Math.max(expandedHeight.current, sheetHeight);
      latestDragHeight.current = sheetHeight;
      document.documentElement.style.setProperty('--bottom-sheet-offset', `${sheetHeight + 20}px`);
      try {
        map.setLocation({
          center: mobileZoneMapCenter(zoneCenter, map.zoom, sheetHeight, map.projection),
          duration: 300,
        });
      } catch (error) {
        console.warn('[ptk] mobile pan failed:', error);
      }
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [isOpen, zone, mapRefHolder, selectedZoneId]);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      dismissible
      handleOnly
      modal={false}
      noBodyStyles
      disablePreventScroll
      autoFocus={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          ref={contentRef}
          data-testid="mobile-zone-card"
          className="surface-opaque fixed inset-x-0 bottom-0 z-50 mx-auto flex flex-col rounded-t-2xl bg-white outline-none lg:hidden dark:bg-zinc-900"
          aria-describedby={undefined}
          style={{ maxHeight: 'calc(var(--keyboard-aware-height, 100dvh) - 80px)' }}
        >
          <Drawer.Title className="sr-only">{t('zone.card')}</Drawer.Title>
          <div
            className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center select-none active:cursor-grabbing"
            data-testid="mobile-zone-card-drag-region"
            onPointerDown={beginDrag}
            onPointerMove={continueDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[15px]">
            {selectedZoneId != null && (
              <ZoneCardContent
                key={selectedZoneId}
                zoneId={selectedZoneId}
                navigation={canReturnToResults ? 'back' : 'close'}
                onClose={() => {
                  handleClose();
                  if (canReturnToResults) onBackToResults?.();
                }}
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
