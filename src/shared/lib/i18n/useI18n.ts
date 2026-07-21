import { useContext } from 'react';
import { I18nContext, type I18nValue } from './context';
import { messages, type MessageParams } from './messages';

const fallback: I18nValue = {
  language: 'ru',
  t: (key, params?: MessageParams) => {
    const template = messages.ru[key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
  },
  formatCount: (kind, count) => {
    const category = new Intl.PluralRules('ru').select(count);
    const unit =
      kind === 'parking'
        ? category === 'one'
          ? 'парковка'
          : category === 'few'
            ? 'парковки'
            : 'парковок'
        : category === 'one'
          ? 'место'
          : category === 'few'
            ? 'места'
            : 'мест';
    return `${count} ${unit}`;
  },
};

export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? fallback;
}
