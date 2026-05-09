import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeRu } from '@/shared/lib/i18n/relative-time';

describe('formatRelativeRu — date-fns с ru-локалью (CARD-02)', () => {
  const FROZEN_NOW = new Date('2026-04-25T12:00:00Z');
  beforeEach(() => vi.useFakeTimers().setSystemTime(FROZEN_NOW));
  afterEach(() => vi.useRealTimers());

  it('5 минут назад содержит "минут" и "назад"', () => {
    const past = new Date(FROZEN_NOW.getTime() - 5 * 60 * 1000).toISOString();
    const s = formatRelativeRu(past);
    expect(s).toMatch(/минут/);
    expect(s).toMatch(/назад/);
  });
  it('через 5 минут — содержит "через" и "минут"', () => {
    const future = new Date(FROZEN_NOW.getTime() + 5 * 60 * 1000).toISOString();
    const s = formatRelativeRu(future);
    expect(s).toMatch(/через/);
    expect(s).toMatch(/минут/);
  });
  it('2 часа назад содержит "час"', () => {
    const past = new Date(FROZEN_NOW.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const s = formatRelativeRu(past);
    expect(s).toMatch(/час/);
  });
});
