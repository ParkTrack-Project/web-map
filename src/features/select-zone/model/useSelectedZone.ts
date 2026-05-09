// ZONE-07 / URL-04 / URL-07 / D-14:
// - selectedZoneId — это ?sel=<int> в URL (single source of truth)
// - setSelectedZone — pushState (создаёт history entry; browser Back закрывает карточку)
// - closeCard — replaceState (Back не возвращает на «безымянное» состояние)
//
// Под капотом nuqs parseAsInteger обрабатывает невалидные значения сам:
// если ?sel=abc → setSel сбросится в null без шума. URL чистый при дефолте
// (clearOnDefault поведение nuqs по умолчанию для null).
import { useQueryState, parseAsInteger } from 'nuqs';

export function useSelectedZone() {
  // Open: history='push' — создаёт entry, browser Back закрывает карточку (URL-07).
  const [sel, setSel] = useQueryState('sel', parseAsInteger.withOptions({ history: 'push' }));
  // Close: history='replace' — не плодим «пустые» entries (D-14).
  const closeCard = () => setSel(null, { history: 'replace' });
  return { selectedZoneId: sel, setSelectedZone: setSel, closeCard };
}
