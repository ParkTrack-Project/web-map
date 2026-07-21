import { useMemo, type PropsWithChildren } from 'react';
import { usePreferences } from '@/features/preferences';
import { messages, type MessageParams } from './messages';
import { I18nContext, type I18nValue } from './context';

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: PropsWithChildren) {
  const language = usePreferences((state) => state.language);
  const value = useMemo<I18nValue>(
    () => ({
      language,
      t: (key, params) => interpolate(messages[language][key], params),
      formatCount: (kind, count) => {
        const unit =
          kind === 'parking'
            ? language === 'ru'
              ? new Intl.PluralRules('ru').select(count) === 'one'
                ? 'парковка'
                : new Intl.PluralRules('ru').select(count) === 'few'
                  ? 'парковки'
                  : 'парковок'
              : count === 1
                ? 'parking area'
                : 'parking areas'
            : language === 'ru'
              ? new Intl.PluralRules('ru').select(count) === 'one'
                ? 'место'
                : new Intl.PluralRules('ru').select(count) === 'few'
                  ? 'места'
                  : 'мест'
              : count === 1
                ? 'space'
                : 'spaces';
        return `${new Intl.NumberFormat(language).format(count)} ${unit}`;
      },
    }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
