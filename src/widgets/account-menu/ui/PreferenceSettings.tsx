import { Languages, Moon, Palette, Sun } from 'lucide-react';
import { usePreferences, type Theme } from '@/features/preferences';
import { useI18n, type Language } from '@/shared/lib/i18n';

function ChoiceButton<T extends string>({
  value,
  selected,
  onSelect,
  children,
}: {
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors ${selected ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'}`}
    >
      {children}
    </button>
  );
}

export function PreferenceSettings() {
  const { t } = useI18n();
  const { theme, language, setTheme, setLanguage } = usePreferences();
  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-4">
      <h2 id="settings-title" className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {t('settings.title')}
      </h2>
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Palette size={14} aria-hidden />
          {t('settings.theme')}
        </div>
        <div role="radiogroup" aria-label={t('settings.theme')} className="flex gap-2">
          <ChoiceButton<Theme> value="light" selected={theme === 'light'} onSelect={setTheme}>
            <Sun size={15} aria-hidden />
            {t('settings.light')}
          </ChoiceButton>
          <ChoiceButton<Theme> value="dark" selected={theme === 'dark'} onSelect={setTheme}>
            <Moon size={15} aria-hidden />
            {t('settings.dark')}
          </ChoiceButton>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Languages size={14} aria-hidden />
          {t('settings.language')}
        </div>
        <div role="radiogroup" aria-label={t('settings.language')} className="flex gap-2">
          <ChoiceButton<Language> value="ru" selected={language === 'ru'} onSelect={setLanguage}>
            {t('settings.russian')}
          </ChoiceButton>
          <ChoiceButton<Language> value="en" selected={language === 'en'} onSelect={setLanguage}>
            {t('settings.english')}
          </ChoiceButton>
        </div>
      </div>
    </section>
  );
}
