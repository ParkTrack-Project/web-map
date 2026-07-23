import { useState, useCallback } from 'react';
import { Locate } from 'lucide-react';
import { Z_INDEX } from '@/shared/config';
import { useGeolocationRequest, useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { PreFlightDrawer } from './PreFlightDrawer';
import { useI18n } from '@/shared/lib/i18n';

async function isGeolocationAlreadyGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

export function WTPMobileFAB() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { request } = useGeolocationRequest();
  const { setFromCoords, from } = useFromCoords();
  const { dest } = useDestination();

  const requestGeolocation = useCallback(async () => {
    const coords = await request();
    if (coords) setFromCoords(coords);
  }, [request, setFromCoords]);

  const handleClick = useCallback(async () => {
    if (await isGeolocationAlreadyGranted()) {
      await requestGeolocation();
      return;
    }
    setOpen(true);
  }, [requestGeolocation]);

  if (from !== null || dest !== null) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t('wtp.title')}
        onClick={handleClick}
        style={{ zIndex: Z_INDEX.wtpFabMobile }}
        className="absolute right-4 bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] lg:hidden"
      >
        <Locate size={24} aria-hidden />
      </button>
      <PreFlightDrawer open={open} onOpenChange={setOpen} onAllow={requestGeolocation} />
    </>
  );
}
