import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProviders } from '@/app/providers';
import { MapPage } from '@/pages/map';
import '@/index.css';

// VITE_API_MODE controls MSW registration.
// - 'mock' (default в DEV/test/staging without real backend) → MSW handles all API
// - 'real' (production or staging-with-real-backend) → MSW skipped, requests hit VITE_API_BASE_URL
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

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AppProviders>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </AppProviders>
      </BrowserRouter>
    </StrictMode>,
  );
}

void enableMocking()
  .catch((error: unknown) => {
    console.error('[bootstrap] Mock Service Worker failed to start:', error);
  })
  .finally(renderApp);
