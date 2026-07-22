import { env } from '@/shared/config';

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      type?: string;
      coordinates?: [number, number][];
    };
  }>;
}

interface DrivingRouteOptions {
  signal?: AbortSignal;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export function parseDrivingRouteResponse(payload: OsrmRouteResponse): [number, number][] {
  const geometry = payload.routes?.[0]?.geometry;
  const coordinates = geometry?.type === 'LineString' ? geometry.coordinates : undefined;
  if (
    payload.code !== 'Ok' ||
    !coordinates ||
    coordinates.length < 2 ||
    coordinates.some(
      ([longitude, latitude]) => !Number.isFinite(longitude) || !Number.isFinite(latitude),
    )
  ) {
    throw new Error('Routing service returned no driving route geometry');
  }
  return coordinates;
}

/** Loads an actual road-following route in GeoJSON coordinate order [lon, lat]. */
export async function buildDrivingRoute(
  points: [number, number][],
  options: DrivingRouteOptions = {},
): Promise<[number, number][]> {
  if (points.length < 2) throw new Error('At least two route points are required');
  const baseUrl = (options.baseUrl ?? env.VITE_ROUTING_GEOMETRY_BASE_URL).replace(/\/$/, '');
  const coordinates = points.map(([longitude, latitude]) => `${longitude},${latitude}`).join(';');
  const url = `${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const requestInit: RequestInit = options.signal ? { signal: options.signal } : {};
  const response = await (options.fetcher ?? fetch)(url, requestInit);
  if (!response.ok) throw new Error(`Routing service request failed (${response.status})`);
  return parseDrivingRouteResponse((await response.json()) as OsrmRouteResponse);
}
