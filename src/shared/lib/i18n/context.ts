import { createContext } from 'react';
import type { Language, MessageKey, MessageParams } from './messages';

export interface I18nValue {
  language: Language;
  t: (key: MessageKey, params?: MessageParams) => string;
  formatCount: (kind: 'parking' | 'space', count: number) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);
