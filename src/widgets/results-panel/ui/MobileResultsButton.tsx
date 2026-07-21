// Mobile: unified entry-point chip — заменяет WTPMobileFAB+отдельный «Показать»-button.
// Три состояния:
// - idle (нет ?from): «Припарковаться» (parking icon) — click → запрос геолокации
//   (instant если permission granted, pre-flight Drawer иначе).
// - loading (есть ?from + isFetching): «Поиск парковок…»
// - ready (есть ?from + data): «N парковок рядом» (иконка ListChecks) — click → открывает sheet.
//
// Hidden когда sheet открыт (open prop) или на desktop.
//
// Permissions API: skip pre-flight если permission='granted' (как WTPCTAButton).
import { useCallback, useState } from 'react';
import { ListChecks } from 'lucide-react';
import {
  useFromCoords,
  useGeolocationRequest,
  useViewportSearchOrigin,
} from '@/features/request-geolocation';
import { useFilteredCandidates } from '@/features/filter-zones';
import { useIsMobile } from '@/shared/lib/responsive';
import { useI18n } from '@/shared/lib/i18n';
import { ClassicCarIcon } from '@/shared/ui';
import { PreFlightDrawer } from '@/widgets/wtp-cta';
import { useRoutingResults } from '../model/useRoutingResults';

interface MobileResultsButtonProps {
  /** true когда MobileResultsSheet open — chip скрывается. */
  hidden: boolean;
  /** Вызывается в ready-state click → Layout открывает sheet. */
  onOpenSheet: () => void;
}

async function isGeolocationAlreadyGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

export function MobileResultsButton({ hidden, onOpenSheet }: MobileResultsButtonProps) {
  const { t, formatCount } = useI18n();
  const { from, setFromCoords } = useFromCoords();
  const { data, isFetching } = useRoutingResults();
  const filtered = useFilteredCandidates(data?.candidates);
  const isMobile = useIsMobile();
  const { request, state } = useGeolocationRequest();
  const viewportOrigin = useViewportSearchOrigin();
  const [preFlightOpen, setPreFlightOpen] = useState(false);

  const requestGeolocation = useCallback(async () => {
    const coords = await request(viewportOrigin);
    if (coords) setFromCoords(coords);
  }, [request, setFromCoords, viewportOrigin]);

  const handleClick = useCallback(async () => {
    if (from) {
      // Уже есть стартовая точка — открываем sheet с результатами.
      onOpenSheet();
      return;
    }
    // Нет ?from — нужен запрос геолокации.
    if (await isGeolocationAlreadyGranted()) {
      await requestGeolocation();
      return;
    }
    setPreFlightOpen(true);
  }, [from, onOpenSheet, requestGeolocation]);

  if (!isMobile || hidden) return null;

  // Determine label + icon by state
  let label: string;
  let Icon: typeof ClassicCarIcon | typeof ListChecks;
  if (!from) {
    label = state.status === 'requesting' ? t('results.locating') : t('results.findNearby');
    Icon = ClassicCarIcon;
  } else if (isFetching && !data) {
    label = t('results.loading');
    Icon = ListChecks;
  } else {
    const count = filtered.length;
    label = t('results.nearbyCount', { count: formatCount('parking', count) });
    Icon = ListChecks;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xl hover:bg-emerald-700 active:scale-[0.98] lg:hidden"
      >
        <Icon size={16} aria-hidden />
        {label}
      </button>
      <PreFlightDrawer
        open={preFlightOpen}
        onOpenChange={setPreFlightOpen}
        onAllow={requestGeolocation}
      />
    </>
  );
}
