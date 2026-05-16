// Quick-fix 2026-05-16 (п.4): geocodeByUri теперь поверх ymaps3.search (JS-API),
// а не HTTP geocode-maps. @/shared/lib/ymaps глобально замокан в tests/setup.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGeo } from '@/shared/lib/ymaps';
import { geocodeByUri, GeocoderError } from './geocoder';

const mockedSearchGeo = vi.mocked(searchGeo);

describe('geocodeByUri (Quick-fix п.4 — ymaps3.search JS-API)', () => {
  beforeEach(() => {
    mockedSearchGeo.mockReset();
    mockedSearchGeo.mockResolvedValue([]);
  });

  it('возвращает coords первого hit ([lat, lon])', async () => {
    mockedSearchGeo.mockResolvedValueOnce([
      { title: 'A', subtitle: '', coords: [59.95598, 30.30943] },
      { title: 'B', subtitle: '', coords: [1, 2] },
    ]);
    const ctrl = new AbortController();
    await expect(geocodeByUri('Кронверкский пр.', ctrl.signal)).resolves.toEqual([
      59.95598, 30.30943,
    ]);
    expect(mockedSearchGeo).toHaveBeenCalledWith('Кронверкский пр.');
  });

  it('пустой результат → GeocoderError', async () => {
    mockedSearchGeo.mockResolvedValueOnce([]);
    const ctrl = new AbortController();
    await expect(geocodeByUri('ничего такого', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });

  it('searchGeo throws → GeocoderError', async () => {
    mockedSearchGeo.mockRejectedValueOnce(new Error('network'));
    const ctrl = new AbortController();
    await expect(geocodeByUri('x', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });

  it('aborted signal → GeocoderError', async () => {
    mockedSearchGeo.mockResolvedValueOnce([{ title: 'A', subtitle: '', coords: [1, 2] }]);
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(geocodeByUri('x', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });
});
