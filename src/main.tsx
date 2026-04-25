import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProviders } from '@/app/providers';
import { MapPage } from '@/pages/map';
import '@/index.css';

// MSW поднимаем только в DEV или при VITE_AUTH_MODE='mock' (preview/CI staging).
// В production-сборке shouldMock=false → service-worker не регистрируется,
// network идёт реально на api.parktrack.live.
async function enableMocking() {
  const shouldMock = import.meta.env.DEV || import.meta.env.VITE_AUTH_MODE === 'mock';
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
