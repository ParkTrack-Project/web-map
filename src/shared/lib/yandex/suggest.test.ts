import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { suggestAddresses, SuggestApiError, SuggestRateLimitedError } from './suggest';

describe('suggestAddresses (D-01 research override — HTTP API)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns [] for empty string без fetch', async () => {
    const ctrl = new AbortController();
    await expect(suggestAddresses('', ctrl.signal)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns [] для query length < SUGGEST_MIN_QUERY_LENGTH', async () => {
    const ctrl = new AbortController();
    await expect(suggestAddresses('К', ctrl.signal)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('hits suggest endpoint с правильными query params', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const ctrl = new AbortController();
    await suggestAddresses('Кронверкский', ctrl.signal);
    const callUrl = fetchSpy.mock.calls[0][0] as string;
    expect(callUrl).toContain('suggest-maps.yandex.ru/v1/suggest');
    expect(callUrl).toContain('apikey=');
    expect(callUrl).toContain(
      'text=%D0%9A%D1%80%D0%BE%D0%BD%D0%B2%D0%B5%D1%80%D0%BA%D1%81%D0%BA%D0%B8%D0%B9',
    );
    expect(callUrl).toContain('lang=ru_RU');
    expect(callUrl).toContain('print_address=1');
    expect(callUrl).toContain('results=7');
  });

  it('возвращает results массив из response', async () => {
    const fakeResults = [
      {
        title: { text: 'Кронверкский пр.' },
        subtitle: { text: 'Санкт-Петербург' },
        uri: 'ymapsbm1://geo?...',
      },
    ];
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: fakeResults }), { status: 200 }),
    );
    const ctrl = new AbortController();
    const out = await suggestAddresses('Кронверкский', ctrl.signal);
    expect(out).toEqual(fakeResults);
  });

  it('throws SuggestRateLimitedError on 429', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));
    const ctrl = new AbortController();
    await expect(suggestAddresses('Кронверкский', ctrl.signal)).rejects.toBeInstanceOf(
      SuggestRateLimitedError,
    );
  });

  it('throws SuggestApiError on non-2xx', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Internal', { status: 500, statusText: 'Internal Server Error' }),
    );
    const ctrl = new AbortController();
    await expect(suggestAddresses('Кронверкский', ctrl.signal)).rejects.toBeInstanceOf(
      SuggestApiError,
    );
  });

  it('передаёт AbortSignal в fetch', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const ctrl = new AbortController();
    await suggestAddresses('Кронверкский', ctrl.signal);
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(opts.signal).toBe(ctrl.signal);
  });
});
