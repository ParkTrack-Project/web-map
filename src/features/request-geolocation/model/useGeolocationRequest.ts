// Phase 4 / WTP-02..05 / D-11..D-13 / Pitfall 4:
// Promise-wrapper над navigator.geolocation.getCurrentPosition.
// - вызывается ТОЛЬКО по клику (lifecycle owned by widgets/wtp-cta)
// - timeout 10s, maximumAge 30s, enableHighAccuracy=false (Pitfall 4)
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

export function useGeolocationRequest() {
  const { t } = useI18n();
  const [state, setState] = useState<GeolocationRequestState>(INITIAL);

  const request = (): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setState({
          status: 'unavailable',
          position: null,
          error: t('wtp.unavailable'),
        });
        resolve(null);
        return;
      }
      setState((s) => ({ ...s, status: 'requesting' }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setState({ status: 'success', position: coords, error: null });
          resolve(coords);
        },
        (err) => {
          let status: GeolocationRequestState['status'] = 'unavailable';
          let message = t('wtp.failed');
          if (err.code === err.PERMISSION_DENIED) {
            status = 'denied';
            message = t('wtp.denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            status = 'unavailable';
            message = t('wtp.failed');
          } else if (err.code === err.TIMEOUT) {
            status = 'timeout';
            message = t('wtp.timeout');
          }
          setState({ status, position: null, error: message });
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: 30_000,
        },
      );
    });
  };

  const reset = () => setState(INITIAL);
  return { state, request, reset };
}
