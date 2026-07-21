import { ChevronRight } from 'lucide-react';
import { useSession } from '@/entities/session';
import { useI18n } from '@/shared/lib/i18n';
import { PreferenceSettings } from './PreferenceSettings';
import { ProjectLinks } from './ProjectLinks';
import { primaryButton, secondaryButton } from './form-fields';

export type AccountScreen = 'home' | 'login' | 'register' | 'profile';

interface Props {
  onNavigate: (screen: AccountScreen) => void;
}

export function AccountPanel({ onNavigate }: Props) {
  const { t } = useI18n();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{t('account.title')}</h2>
      {status === 'loading' ? (
        <div role="status" className="py-5 text-center text-sm text-zinc-500">
          {t('common.loading')}
        </div>
      ) : user ? (
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex min-h-16 items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {user.full_name || t('common.notSpecified')}
            </span>
            <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
          </span>
          <ChevronRight size={18} aria-hidden className="text-zinc-400" />
        </button>
      ) : (
        <div className="flex gap-2">
          <button type="button" className={primaryButton} onClick={() => onNavigate('login')}>
            {t('account.signIn')}
          </button>
          <button type="button" className={secondaryButton} onClick={() => onNavigate('register')}>
            {t('account.create')}
          </button>
        </div>
      )}
      <PreferenceSettings />
      <ProjectLinks />
    </div>
  );
}
