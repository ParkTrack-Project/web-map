// Phase 4 / WTP-02..05 / D-11..D-13 / Pitfall 4:
// Promise-wrapper над navigator.geolocation.getCurrentPosition.
// - вызывается ТОЛЬКО по клику (lifecycle owned by widgets/wtp-cta)
// - первый запрос экономный; временный POSITION_UNAVAILABLE (в частности,
//   kCLErrorLocationUnknown на macOS) повторяется с повышенной точностью
// - error code → discriminated status; error message русский, ready для inline banner (D-12)
import { useState } from 'react';
import { GEOLOCATION_TIMEOUT_MS } from '@/shared/config';
import { useI18n } from '@/shared/lib/i18n';

export interface GeolocationRequestState {
  status: 'idle' | 'requesting' | 'success' | 'denied' | 'unavailable' | 'timeout';
  position: [number, number] | null;
  error: string | null;
}

const INITIAL: GeolocationRequestState = { status: 'idle', position: null, error: null };
const RETRY_DELAY_MS = 400;

const PRIMARY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: GEOLOCATION_TIMEOUT_MS,
  maximumAge: 30_000,
};

const RETRY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: GEOLOCATION_TIMEOUT_MS,
  maximumAge: 0,
};

function getPosition(geolocation: Geolocation, options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function waitBeforeRetry() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
}

export function useGeolocationRequest() {
  const { t } = useI18n();
  const [state, setState] = useState<GeolocationRequestState>(INITIAL);

  const request = async (): Promise<[number, number] | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({
        status: 'unavailable',
        position: null,
        error: t('wtp.unavailable'),
      });
      return null;
    }

    setState((current) => ({ ...current, status: 'requesting', error: null }));

    try {
      let position: GeolocationPosition;
      try {
        position = await getPosition(navigator.geolocation, PRIMARY_OPTIONS);
      } catch (error) {
        const geolocationError = error as GeolocationPositionError;
        if (geolocationError.code !== geolocationError.POSITION_UNAVAILABLE) throw error;
        await waitBeforeRetry();
        position = await getPosition(navigator.geolocation, RETRY_OPTIONS);
      }

      const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
      setState({ status: 'success', position: coords, error: null });
      return coords;
    } catch (error) {
      const geolocationError = error as GeolocationPositionError;
      let status: GeolocationRequestState['status'] = 'unavailable';
      let message = t('wtp.failed');
      if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
        status = 'denied';
        message = t('wtp.denied');
      } else if (geolocationError.code === geolocationError.TIMEOUT) {
        status = 'timeout';
        message = t('wtp.timeout');
      }
      setState({ status, position: null, error: message });
      return null;
    }
  };

  const reset = () => setState(INITIAL);
  return { state, request, reset };
}
