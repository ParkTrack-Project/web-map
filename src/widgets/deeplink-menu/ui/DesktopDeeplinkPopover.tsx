// Phase 4 / ROUTE-06 / D-32:
// Desktop radix Popover, 3 опции вертикально; Яндекс Навигатор autoFocus.
// Trigger button [В путь →] disabled когда coordsValid===false (D-34 guard).
import * as Popover from '@radix-ui/react-popover';
import { Navigation, ArrowRightCircle } from 'lucide-react';
import { Z_INDEX } from '@/shared/config';
import { useNavigatorLauncher } from '../model/useNavigatorLauncher';
import { useI18n } from '@/shared/lib/i18n';

interface Props {
  from: [number, number] | null;
  to: [number, number] | null;
  coordsValid: boolean;
}

export function DesktopDeeplinkPopover({ from, to, coordsValid }: Props) {
  const { t } = useI18n();
  const { yandexNavigatorAvailable, launchYandexNavigator, launchYandexMapsWeb, launchGoogleMaps } =
    useNavigatorLauncher();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={!coordsValid}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          data-testid="in-put-button"
        >
          <ArrowRightCircle size={16} aria-hidden /> {t('route.go')}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          style={{ zIndex: Z_INDEX.deeplinkPopover }}
          className="surface-opaque w-[260px] rounded-xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-lg outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          data-testid="desktop-deeplink-popover"
        >
          {yandexNavigatorAvailable && (
            <button
              type="button"
              autoFocus
              onClick={() => launchYandexNavigator(from, to)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-zinc-800"
            >
              <Navigation size={14} aria-hidden /> {t('route.yandexNavigator')}
            </button>
          )}
          <button
            type="button"
            autoFocus={!yandexNavigatorAvailable}
            onClick={() => launchYandexMapsWeb(from, to)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-zinc-800"
          >
            {t('route.yandexMaps')}
          </button>
          <button
            type="button"
            onClick={() => launchGoogleMaps(from, to)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-zinc-800"
          >
            Google Maps
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
