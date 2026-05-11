import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProviders } from '@/app/providers';
import { MapPage } from '@/pages/map';
import '@/index.css';

// VITE_API_MODE controls MSW registration.
// - 'mock' (default in DEV/test/staging without real backend) → MSW handles
//   /zones, /occupancy, /forecasts, /routing/*
// - 'real' (production or staging-with-real-backend) → MSW skipped, requests hit
//   env.VITE_API_BASE_URL (api.parktrack.live)
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
