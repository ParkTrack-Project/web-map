// Phase 5 D-34 (NFR-07): offline detection via TanStack onlineManager.
// Pitfall 8: navigator.onLine залипает на false в Chrome — НЕ читаем напрямую.
// onlineManager handles edge cases (Chrome bug) and listens to online/offline events.
import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { toast } from '@/shared/ui';
import { useI18n } from '@/shared/lib/i18n';

export function OfflineBanner() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(() => !onlineManager.isOnline());

  useEffect(() => {
    return onlineManager.subscribe((isOnline) => {
      setIsOffline(!isOnline);
      if (!isOnline) {
        toast.error(t('network.offline'), { id: 'offline', duration: Infinity });
      } else {
        toast.dismiss('offline');
        toast.success(t('network.online'), { duration: 3000 });
      }
    });
  }, [t]);

  if (!isOffline) return null;
  return (
    <div
      role="status"
      className="fixed top-0 right-0 left-0 z-[200] bg-amber-100 py-2 text-center text-sm text-amber-900"
    >
      {t('network.offline')}
    </div>
  );
}
