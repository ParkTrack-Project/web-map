import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchGeo } from '@/shared/lib/ymaps';
import { lookupAddressAt } from './reverse-geocode';

const mockedSearchGeo = vi.mocked(searchGeo);

describe('lookupAddressAt', () => {
  beforeEach(() => {
    mockedSearchGeo.mockReset();
  });

  it('returns a readable address near the supplied coordinates', async () => {
    mockedSearchGeo.mockResolvedValueOnce([
      {
        title: 'проспект Ленина, 11',
        subtitle: 'Петрозаводск',
        coords: [61.79, 34.36],
      },
    ]);

    await expect(lookupAddressAt([34.36, 61.79])).resolves.toBe(
      'проспект Ленина, 11, Петрозаводск',
    );
    expect(mockedSearchGeo).toHaveBeenCalledWith('61.790000, 34.360000', [
      [34.358, 61.788],
      [34.362, 61.792],
    ]);
  });

  it('returns null for an aborted lookup', async () => {
    mockedSearchGeo.mockResolvedValueOnce([
      { title: 'Address', subtitle: '', coords: [61.79, 34.36] },
    ]);
    const controller = new AbortController();
    controller.abort();
    await expect(lookupAddressAt([34.36, 61.79], controller.signal)).resolves.toBeNull();
  });
});
