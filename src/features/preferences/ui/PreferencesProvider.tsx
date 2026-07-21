import { useEffect, type PropsWithChildren } from 'react';
import { usePreferences } from '../model/preferences.store';

export function PreferencesProvider({ children }: PropsWithChildren) {
  const theme = usePreferences((state) => state.theme);
  const language = usePreferences((state) => state.language);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return children;
}
