import { useContext, useEffect, useRef } from 'react';
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

  const { mode } = useTimeMode();
  const { data: zone } = useZoneByIdQuery(selectedZoneId, mode);

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
          <div className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300" aria-hidden />
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
