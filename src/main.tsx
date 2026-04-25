import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Spinner } from '@/shared/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Spinner label="Bootstrapping…" />
  </StrictMode>,
);
