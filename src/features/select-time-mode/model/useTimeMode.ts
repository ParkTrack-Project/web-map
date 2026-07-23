import { useQueryState } from 'nuqs';
import { parseAsTimeMode } from '@/shared/lib/url';
import type { TimeMode } from '@/entities/zone';

const NOW: TimeMode = { kind: 'now' };

export function useTimeMode() {
  const [mode, setMode] = useQueryState<TimeMode>(
    't',
    parseAsTimeMode.withDefault(NOW).withOptions({
      history: 'replace',
      clearOnDefault: true,
    }),
  );
  const setNow = () => setMode(NOW);
  return { mode, setMode, setNow };
}
