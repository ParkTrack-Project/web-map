// Phase 4 / ROUTE-06 / D-32 mobile vaul Drawer.
// 3 кнопки (Яндекс Навигатор autoFocus / Яндекс Карты web / Google Maps) + Отмена.
// 44×44 tap targets per A11Y guidelines (min-h-[44px]).
import { useState } from 'react';
import { Drawer } from 'vaul';
import { Navigation, ArrowRightCircle } from 'lucide-react';
import { useNavigatorLauncher } from '../model/useNavigatorLauncher';

interface Props {
  from: [number, number] | null;
  to: [number, number] | null;
  coordsValid: boolean;
}

export function MobileDeeplinkSheet({ from, to, coordsValid }: Props) {
  const [open, setOpen] = useState(false);
  const { launchYandexNavigator, launchYandexMapsWeb, launchGoogleMaps } = useNavigatorLauncher();
  const handleAndClose = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!coordsValid}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        data-testid="in-put-button"
      >
        <ArrowRightCircle size={16} aria-hidden /> В путь →
      </button>
      <Drawer.Root open={open} onOpenChange={setOpen} dismissible>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-50 mx-auto rounded-t-2xl bg-white p-4 outline-none lg:hidden"
            aria-describedby={undefined}
            data-testid="mobile-deeplink-sheet"
          >
            <Drawer.Title className="mb-3 text-base font-semibold">
              Открыть в навигаторе
            </Drawer.Title>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                autoFocus
                onClick={handleAndClose(() => launchYandexNavigator(from, to))}
                className="flex min-h-[44px] items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Navigation size={14} aria-hidden /> Яндекс Навигатор
              </button>
              <button
                type="button"
                onClick={handleAndClose(() => launchYandexMapsWeb(from, to))}
                className="min-h-[44px] rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50"
              >
                Яндекс Карты (web)
              </button>
              <button
                type="button"
                onClick={handleAndClose(() => launchGoogleMaps(from, to))}
                className="min-h-[44px] rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50"
              >
                Google Maps
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-md text-sm font-medium text-zinc-500 hover:bg-zinc-50"
              >
                Отмена
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
