import { DesktopLayout } from './ui/DesktopLayout';
import { MobileLayout } from './ui/MobileLayout';
import { TimeModeLiveRegion } from '@/widgets/time-selector';
import { ResultsMapSync } from '@/widgets/results-panel';
import { useIsMobile } from '@/shared/lib/responsive';

export function MapPage() {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      <ResultsMapSync />
      <TimeModeLiveRegion />
    </>
  );
}
