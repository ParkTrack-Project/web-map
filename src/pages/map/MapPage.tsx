import { DesktopLayout } from './ui/DesktopLayout';
import { MobileLayout } from './ui/MobileLayout';
import { TimeModeLiveRegion } from '@/widgets/time-selector';
import { ResultsMapSync } from '@/widgets/results-panel';

export function MapPage() {
  return (
    <>
      <DesktopLayout />
      <MobileLayout />
      <ResultsMapSync />
      <TimeModeLiveRegion />
    </>
  );
}
