// Vitest global setup: jest-dom matchers + MSW node server + ymaps3 module mock.
import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '@/mocks/node';

// Mock ymaps3 module so RTL tests рендерящие MapCanvas не падают (Pitfall #19).
// Plan 03 создаст реальный @/shared/lib/ymaps — этот мок будет работать как drop-in
// замена. Если форма экспорта в Plan 03 поменяется, обновить вместе.
vi.mock('@/shared/lib/ymaps', () => ({
  YMap: ({ children }: { children?: React.ReactNode }) => children,
  YMapDefaultSchemeLayer: () => null,
  YMapDefaultFeaturesLayer: () => null,
  YMapFeature: () => null,
  YMapListener: () => null,
  YMapMarker: () => null,
  YMapControls: ({ children }: { children?: React.ReactNode }) => children,
  YMapZoomControl: () => null,
  YMapGeolocationControl: () => null,
  reactify: { useDefault: <T>(v: T): T => v },
  useDefault: <T>(v: T): T => v,
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
