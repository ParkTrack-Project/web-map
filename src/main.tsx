import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProviders } from '@/app/providers';
import { MapPage } from '@/pages/map';
import '@/index.css';

// Phase 5 D-15: VITE_API_MODE controls MSW registration independently of VITE_AUTH_MODE.
// - 'mock' (default in DEV/test/staging without real backend) → MSW handles
//   /zones, /occupancy, /forecasts, /routing/*, /auth/me
// - 'real' (production or staging-with-real-backend) → MSW skipped, requests hit
//   env.VITE_API_BASE_URL (api.parktrack.live)
// Default behaviour: in DEV without explicit VITE_API_MODE → mock (preserve dev UX).
// In production builds without explicit VITE_API_MODE → also mock (safe default until
// staging build pins VITE_API_MODE=real). Independent from VITE_AUTH_MODE: enables
// 4-combo testing (mock-API+mock-auth, mock-API+shared-auth, real-API+mock-auth,
// real-API+shared-auth).
async function enableMocking() {
  const apiMode = import.meta.env.VITE_API_MODE ?? 'mock';
  const shouldMock = apiMode === 'mock' || (import.meta.env.DEV && !import.meta.env.VITE_API_MODE);
  if (!shouldMock) return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AppProviders>
          <Routes>
            <Route path="/map" element={<MapPage />} />
            <Route path="/" element={<MapPage />} />
          </Routes>
        </AppProviders>
      </BrowserRouter>
    </StrictMode>,
  );
});
