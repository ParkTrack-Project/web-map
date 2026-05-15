// Quick-fix 2026-05-16 (п.4): suggestAddresses теперь поверх ymaps3.search
// (JS-API), а не HTTP suggest-maps. @/shared/lib/ymaps глобально замокан в
// tests/setup.ts (searchGeo: vi.fn) — переопределяем per-case.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGeo } from '@/shared/lib/ymaps';
import { suggestAddresses, SuggestApiError } from './suggest';

const mockedSearchGeo = vi.mocked(searchGeo);

describe('suggestAddresses (Quick-fix п.4 — ymaps3.search JS-API)', () => {
  beforeEach(() => {
    mockedSearchGeo.mockReset();
    mockedSearchGeo.mockResolvedValue([]);
  });

  it('returns [] for empty string без вызова searchGeo', async () => {
    const ctrl = new AbortController();
    await expect(suggestAddresses('', ctrl.signal)).resolves.toEqual([]);
    expect(mockedSearchGeo).not.toHaveBeenCalled();
  });

  it('returns [] для query length < SUGGEST_MIN_QUERY_LENGTH', async () => {
    const ctrl = new AbortController();
    await expect(suggestAddresses('К', ctrl.signal)).resolves.toEqual([]);
    expect(mockedSearchGeo).not.toHaveBeenCalled();
  });

  it('маппит hits searchGeo → SuggestResult (title/subtitle/uri/coords)', async () => {
    mockedSearchGeo.mockResolvedValueOnce([
      { title: 'Кронверкский пр.', subtitle: 'Санкт-Петербург', coords: [59.95598, 30.30943] },
    ]);
    const ctrl = new AbortController();
    const out = await suggestAddresses('Кронверкский', ctrl.signal);
    expect(mockedSearchGeo).toHaveBeenCalledWith('Кронверкский');
    expect(out).toEqual([
      {
        title: { text: 'Кронверкский пр.' },
        subtitle: { text: 'Санкт-Петербург' },
        uri: 'Кронверкский пр.',
        coords: [59.95598, 30.30943],
      },
    ]);
  });

  it('пустой subtitle → поле subtitle отсутствует', async () => {
    mockedSearchGeo.mockResolvedValueOnce([{ title: 'X', subtitle: '', coords: [1, 2] }]);
    const ctrl = new AbortController();
    const out = await suggestAddresses('Кронв', ctrl.signal);
    expect(out[0]?.subtitle).toBeUndefined();
  });

  it('aborted signal → [] (результаты отбрасываются)', async () => {
    mockedSearchGeo.mockResolvedValueOnce([{ title: 'X', subtitle: '', coords: [1, 2] }]);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(suggestAddresses('Кронв', ctrl.signal)).resolves.toEqual([]);
  });

  it('searchGeo throws → SuggestApiError (ошибка видна, не глотается)', async () => {
    mockedSearchGeo.mockRejectedValueOnce(new Error('403 Forbidden'));
    const ctrl = new AbortController();
    await expect(suggestAddresses('Кронв', ctrl.signal)).rejects.toBeInstanceOf(SuggestApiError);
  });
});
