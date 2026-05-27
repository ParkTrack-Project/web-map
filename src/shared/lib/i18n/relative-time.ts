// CARD-02: «обновлено N минут назад» через date-fns с локалью ru.
// date-fns ^4.1.0 → каноничный путь импорта ru-локали — `date-fns/locale`.
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatRelativeRu(iso?: string | null): string {
  if (!iso) return 'неизвестно';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return 'неизвестно';
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: ru });
}