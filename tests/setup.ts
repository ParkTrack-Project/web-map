// Vitest global setup: jest-dom matchers + MSW node server + ymaps3 module mock.
import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '@/mocks/node';
import { usePreferences } from '@/features/preferences';

vi.mock('@/shared/lib/ymaps', () => ({
  YMap: ({ children }: { children?: React.ReactNode }) => children,
  YMapDefaultSchemeLayer: () => null,
  YMapDefaultFeaturesLayer: () => null,
  YMapFeature: () => null,
  YMapFeatureDataSource: () => null,
  YMapLayer: () => null,
  YMapListener: () => null,
  YMapMarker: () => null,
  YMapControls: ({ children }: { children?: React.ReactNode }) => children,
  YMapZoomControl: () => null,
  YMapGeolocationControl: () => null,
  YMapRotateTiltControl: () => null,
  reactify: { useDefault: <T>(v: T): T => v },
  useDefault: <T>(v: T): T => v,
  searchGeo: vi.fn(async () => []),
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.removeItem('parktrack:preferences:v1');
  usePreferences.setState({ theme: 'light', language: 'ru' });
});
afterAll(() => server.close());
