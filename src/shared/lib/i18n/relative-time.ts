// CARD-02: «обновлено N минут назад» через date-fns с локалью ru.
// date-fns ^4.1.0 → каноничный путь импорта ru-локали — `date-fns/locale`.
import { formatDistanceToNow } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

export function formatRelativeRu(iso?: string | null): string {
  return formatRelative(iso, 'ru');
}

export function formatRelative(iso: string | null | undefined, language: 'ru' | 'en'): string {
  if (!iso) return language === 'ru' ? 'неизвестно' : 'unknown';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return language === 'ru' ? 'неизвестно' : 'unknown';
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: language === 'ru' ? ru : enUS });
}
