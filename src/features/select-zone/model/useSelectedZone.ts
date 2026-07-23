import { useQueryState, parseAsInteger } from 'nuqs';

export function useSelectedZone() {
  const [sel, setSel] = useQueryState('sel', parseAsInteger.withOptions({ history: 'push' }));
  const closeCard = () => setSel(null, { history: 'replace' });
  return { selectedZoneId: sel, setSelectedZone: setSel, closeCard };
}
