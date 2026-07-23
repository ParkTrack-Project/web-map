import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { roundBbox5, type Bbox } from '@/shared/lib/geo';
import { LIVE_DATA_REFETCH_MS } from '@/shared/config';
import { fetchZones, fetchZoneById } from '../api/zone.api';
import type { TimeMode } from '../model/zone.types';

function staleTimeForListMode(mode: TimeMode): number {
  if (mode.kind === 'past') return 300_000; // /occupancy — history immutable
  if (mode.kind === 'future') return 60_000; // /forecasts — decay quickly
  return 30_000; // /zones (now) — ML refresh cadence
}

function liveRefetchInterval(mode: TimeMode): number | false {
  return mode.kind === 'now' ? LIVE_DATA_REFETCH_MS : false;
}

function staleTimeForCardMode(mode: TimeMode): number {
  if (mode.kind === 'past') return 300_000; // /occupancy view=card
  return 60_000; // /zones/:id (now) или /forecasts view=card
}

export function useZonesQuery(
  bbox: Bbox | null,
  serverQuery: Record<string, string> = {},
  mode: TimeMode = { kind: 'now' },
) {
  if ((mode.kind === 'past' || mode.kind === 'future') && !mode.at) {
    throw new Error(`[useZonesQuery] mode.kind=${mode.kind} requires .at (TimeMode invariant)`);
  }
  const rounded = bbox ? roundBbox5(bbox) : null;
  return useQuery({
    queryKey: ['zones', mode, rounded, serverQuery] as const,
    queryFn: ({ signal }) => fetchZones(rounded!, serverQuery, mode, signal),
    enabled: rounded !== null,
    placeholderData: keepPreviousData,
    staleTime: staleTimeForListMode(mode),
    refetchInterval: liveRefetchInterval(mode),
  });
}

export function useZoneByIdQuery(id: number | null, mode: TimeMode = { kind: 'now' }) {
  if ((mode.kind === 'past' || mode.kind === 'future') && !mode.at) {
    throw new Error(`[useZoneByIdQuery] mode.kind=${mode.kind} requires .at (TimeMode invariant)`);
  }
  return useQuery({
    queryKey: ['zone', id, mode] as const,
    queryFn: ({ signal }) => fetchZoneById(id!, signal, mode),
    enabled: id !== null,
    staleTime: staleTimeForCardMode(mode),
    refetchInterval: liveRefetchInterval(mode),
  });
}
