// TIME-02 / Q1 fix: fetchZones диспатчит правильный endpoint+params на основе TimeMode.
// Mock apiClient.get → проверяем точно URL и query params, что отправляются в axios.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/api', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

import { fetchZones } from '@/entities/zone';
import { apiClient } from '@/shared/api';

describe('fetchZones mode dispatch (TIME-02, Q1 fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mode=now → /zones, нет лишних params', async () => {
    const ctl = new AbortController();
    await fetchZones([0, 0, 1, 1], {}, { kind: 'now' }, ctl.signal);
    expect(apiClient.get).toHaveBeenCalledWith('/zones', {
      params: { bbox: '0,0,1,1', view: 'map' },
      signal: ctl.signal,
    });
  });

  it('mode=past → /occupancy + at + view=map', async () => {
    const ctl = new AbortController();
    await fetchZones(
      [0, 0, 1, 1],
      {},
      { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
      ctl.signal,
    );
    expect(apiClient.get).toHaveBeenCalledWith('/occupancy', {
      params: { bbox: '0,0,1,1', view: 'map', at: '2026-04-22T09:00:00.000Z' },
      signal: ctl.signal,
    });
  });

  it('mode=future + serverQuery → /forecasts + слитые params', async () => {
    const ctl = new AbortController();
    await fetchZones(
      [0, 0, 1, 1],
      { fNoFree: 'true' },
      { kind: 'future', at: '2026-04-25T17:00:00.000Z' },
      ctl.signal,
    );
    expect(apiClient.get).toHaveBeenCalledWith('/forecasts', {
      params: {
        bbox: '0,0,1,1',
        view: 'map',
        at: '2026-04-25T17:00:00.000Z',
        fNoFree: 'true',
      },
      signal: ctl.signal,
    });
  });

  it('mode=now + serverQuery → /zones со спред-нутыми filter params', async () => {
    const ctl = new AbortController();
    await fetchZones(
      [0, 0, 1, 1],
      { min_free_count: '1', is_active: 'true' },
      { kind: 'now' },
      ctl.signal,
    );
    expect(apiClient.get).toHaveBeenCalledWith('/zones', {
      params: { bbox: '0,0,1,1', view: 'map', min_free_count: '1', is_active: 'true' },
      signal: ctl.signal,
    });
  });
});
