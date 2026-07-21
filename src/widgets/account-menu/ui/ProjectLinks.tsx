import * as Dialog from '@radix-ui/react-dialog';
import { Code, ExternalLink, ShieldCheck, Smartphone, UserRoundX, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/shared/lib/i18n';
import { currentMobilePlatform } from '../model/platform';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.parktrack.mobile';
const IOS_WEB_URL = 'https://m.parktrack.live';

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function ProjectLinks() {
  const { t } = useI18n();
  const [choiceOpen, setChoiceOpen] = useState(false);
  const links = [
    ['https://parktrack.live/privacy', t('links.privacy'), ShieldCheck],
    ['https://parktrack.live/data-erasure', t('links.erasure'), UserRoundX],
    ['https://github.com/ParkTrack-Project', t('links.github'), Code],
  ] as const;

  const openMobile = () => {
    const platform = currentMobilePlatform();
    if (platform === 'android') openExternal(GOOGLE_PLAY_URL);
    else if (platform === 'ios') openExternal(IOS_WEB_URL);
    else setChoiceOpen(true);
  };

  return (
    <section
      aria-labelledby="project-links-title"
      className="border-t border-zinc-200 pt-4 dark:border-zinc-800"
    >
      <h2 id="project-links-title" className="sr-only">
        {t('links.title')}
      </h2>
      <div className="flex flex-col gap-1">
        {links.map(([href, label, Icon]) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label}. ${t('links.opensNewTab')}`}
            className="flex min-h-11 items-center justify-between rounded-lg px-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span className="flex items-center gap-2">
              <Icon size={16} aria-hidden />
              {label}
            </span>
            <ExternalLink size={15} aria-hidden className="text-zinc-400" />
          </a>
        ))}
        <button
          type="button"
          onClick={openMobile}
          className="flex min-h-11 items-center justify-between rounded-lg px-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Smartphone size={16} aria-hidden />
            {t('links.mobile')}
          </span>
          <ExternalLink size={15} aria-hidden className="text-zinc-400" />
        </button>
      </div>

      <Dialog.Root open={choiceOpen} onOpenChange={setChoiceOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-[81] w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
            <Dialog.Title className="pr-10 text-lg font-semibold">
              {t('links.mobileChoice')}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t('links.mobileChoiceDescription')}
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} aria-hidden />
              </button>
            </Dialog.Close>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('links.googlePlay')}
              </a>
              <a
                href={IOS_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t('links.iosWeb')}
              </a>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
