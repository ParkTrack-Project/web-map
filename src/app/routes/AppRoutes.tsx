import { Route, Routes } from 'react-router';
import { AppPage } from '@/pages/app';
import { MapPage } from '@/pages/map';
import { NotFoundPage } from '@/pages/not-found';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
