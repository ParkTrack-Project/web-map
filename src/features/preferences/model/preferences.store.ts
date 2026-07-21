import { create } from 'zustand';
import type { Language } from '@/shared/lib/i18n/messages';

export type Theme = 'light' | 'dark';
export const PREFERENCES_STORAGE_KEY = 'parktrack:preferences:v1';

interface StoredPreferences {
  theme?: Theme;
  language?: Language;
}

function readStored(): StoredPreferences {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}',
    ) as StoredPreferences;
  } catch {
    return {};
  }
}

function initialTheme(stored: StoredPreferences): Theme {
  if (stored.theme === 'light' || stored.theme === 'dark') return stored.theme;
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function initialLanguage(stored: StoredPreferences): Language {
  if (stored.language === 'ru' || stored.language === 'en') return stored.language;
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')
    ? 'en'
    : 'ru';
}

function save(values: StoredPreferences) {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(values));
}

const stored = readStored();

interface PreferencesState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language, reload?: boolean) => void;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  theme: initialTheme(stored),
  language: initialLanguage(stored),
  setTheme: (theme) => {
    save({ theme, language: get().language });
    set({ theme });
  },
  setLanguage: (language, reload = true) => {
    if (language === get().language) return;
    save({ theme: get().theme, language });
    set({ language });
    if (reload && typeof window !== 'undefined') window.location.reload();
  },
}));
