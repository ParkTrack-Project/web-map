// CARD-02: «обновлено N минут назад» через date-fns с локалью ru.
// date-fns ^4.1.0 → каноничный путь импорта ru-локали — `date-fns/locale`
// (см. plan Task 1 pre-step + web-map/package.json).
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatRelativeRu(iso: string): string {
  // addSuffix: true → '5 минут назад' / 'через 5 минут'
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
}
