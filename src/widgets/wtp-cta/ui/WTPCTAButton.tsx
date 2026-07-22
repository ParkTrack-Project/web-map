// Phase 4 / WTP-01 / D-08 / CO-01 (B-4 fix):
// Desktop primary CTA. Inline-flex within parent flex-row in DesktopLayout (CO-01 fix).
// Permissions API skip-logic: если user уже разрешил геолокацию ранее (state='granted'),
// при click пропускаем pre-flight modal и сразу запрашиваем координаты — explainer
// показывается ТОЛЬКО при первом запросе (когда state='prompt' или 'denied').
// Request flow владеется здесь, передаётся в PreFlightDialog как onAllow prop.
// НЕ вызывает getCurrentPosition при mount (WTP-02 enforcement).
//
// Fix 2026-05-26: пропс `onManualEntry` удалён — кнопка «Указать вручную» из
// PreFlightDialog убрана, callback некому вызывать.
import { useCallback } from 'react';
import { Z_INDEX } from '@/shared/config';
import { ClassicCarIcon } from '@/shared/ui';
import { useGeolocationRequest, useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { PreFlightDialog } from './PreFlightDialog';
import { useWtpPrompt } from '../model/useWtpPrompt';
import { useI18n } from '@/shared/lib/i18n';

async function isGeolocationAlreadyGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state === 'granted';
  } catch {
    // Some browsers throw on geolocation permission name — treat as unknown.
    return false;
  }
}

export function WTPCTAButton() {
  const { t } = useI18n();
  // Quick-fix 2026-05-16: open вынесен в общий стор — SearchBar открывает это
  // же окно после выбора адреса.
  const open = useWtpPrompt((s) => s.open);
  const setOpen = useWtpPrompt((s) => s.setOpen);
  const { request } = useGeolocationRequest();
  const { setFromCoords } = useFromCoords();
  const { clearDestination } = useDestination();

  const requestGeolocation = useCallback(async () => {
    const coords = await request();
    if (coords) setFromCoords(coords);
  }, [request, setFromCoords]);

  const handleClick = useCallback(async () => {
    // «Припарковаться» = искать парковки рядом с МОИМ местоположением. Если был
    // выбран адрес (?dest), сбрасываем его — иначе режим остаётся
    // route_to_destination и панель продолжает показывать «Парковки у адреса».
    // Очистка ?dest переключает на find_parking → заголовок «Парковки рядом».
    // (Авто-окно после выбора адреса в SearchBar идёт через PreFlightDialog.onAllow,
    // НЕ через этот handler, поэтому тот флоу «парковки у адреса» не ломается.)
    clearDestination();
    // Skip pre-flight when user already granted permission earlier in this origin.
    if (await isGeolocationAlreadyGranted()) {
      await requestGeolocation();
      return;
    }
    setOpen(true);
  }, [clearDestination, requestGeolocation, setOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={t('wtp.action')}
        onClick={handleClick}
        style={{ zIndex: Z_INDEX.wtpCtaDesktop }}
        className="hidden items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] lg:inline-flex"
      >
        <ClassicCarIcon size={18} aria-hidden />
        {t('wtp.action')}
      </button>
      <PreFlightDialog open={open} onOpenChange={setOpen} onAllow={requestGeolocation} />
    </>
  );
}
