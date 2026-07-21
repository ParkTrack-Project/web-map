import * as Popover from '@radix-ui/react-popover';
import { ArrowLeft, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';
import { useIsMobile } from '@/shared/lib/responsive';
import { useI18n } from '@/shared/lib/i18n';
import { AccountPanel, type AccountScreen } from './AccountPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ProfileForm } from './ProfileForm';

interface Props {
  placement: 'desktop' | 'mobile';
}

function PanelContent({
  screen,
  setScreen,
}: {
  screen: AccountScreen;
  setScreen: (screen: AccountScreen) => void;
}) {
  if (screen === 'login') return <LoginForm onBack={() => setScreen('home')} />;
  if (screen === 'register') return <RegisterForm onBack={() => setScreen('home')} />;
  if (screen === 'profile') return <ProfileForm onBack={() => setScreen('home')} />;
  return <AccountPanel onNavigate={setScreen} />;
}

export function AccountMenu({ placement }: Props) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<AccountScreen>('home');
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setScreen('home');
  };
  const trigger = (
    <button
      type="button"
      aria-label={t('account.open')}
      className={`${placement === 'desktop' ? 'absolute top-4 right-4' : 'absolute top-[calc(env(safe-area-inset-top)+0.5rem)] right-2'} z-40 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-lg hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`}
    >
      <UserRound size={20} aria-hidden />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={changeOpen} dismissible>
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[61] max-h-[92dvh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-zinc-950 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
            <Drawer.Title className="sr-only">{t('account.title')}</Drawer.Title>
            <Drawer.Description className="sr-only">
              {t('account.panelDescription')}
            </Drawer.Description>
            <div className="mb-3 flex min-h-10 items-center justify-between">
              {screen !== 'home' ? (
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  aria-label={t('common.back')}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft size={20} aria-hidden />
                </button>
              ) : (
                <span />
              )}
              <Drawer.Close asChild>
                <button
                  type="button"
                  aria-label={t('common.close')}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={19} aria-hidden />
                </button>
              </Drawer.Close>
            </div>
            <PanelContent screen={screen} setScreen={setScreen} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[61] max-h-[calc(100dvh-5rem)] w-[360px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <div className="mb-2 flex min-h-10 items-center justify-between">
            {screen !== 'home' ? (
              <button
                type="button"
                onClick={() => setScreen('home')}
                aria-label={t('common.back')}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft size={20} aria-hidden />
              </button>
            ) : (
              <span />
            )}
            <Popover.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={19} aria-hidden />
              </button>
            </Popover.Close>
          </div>
          <PanelContent screen={screen} setScreen={setScreen} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
