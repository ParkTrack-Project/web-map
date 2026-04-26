// Phase 4 / WTP-01 / D-09 / D-50 / CO-04 (W-3 fix):
// Mobile FAB bottom-right 56×56 brand-green с иконкой Locate.
// Z_INDEX.wtpFabMobile = 20 — НИЖЕ filtersFab/timeSelectorChip (z-30) во избежание перекрытия (D-50).
// CO-04: при `from || dest` (results-active mode) FAB скрывается — закрытие results
// делается через X-кнопку внутри MobileResultsSheet header'а (D-50 формализация).
import { useState, useCallback } from 'react';
import { Locate } from 'lucide-react';
import { Z_INDEX } from '@/shared/config';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { PreFlightDrawer } from './PreFlightDrawer';

interface WTPMobileFABProps {
  onManualEntry?: () => void;
}

export function WTPMobileFAB({ onManualEntry }: WTPMobileFABProps = {}) {
  const [open, setOpen] = useState(false);
  const handleManual = useCallback(() => onManualEntry?.(), [onManualEntry]);
  const { from } = useFromCoords();
  const { dest } = useDestination();

  // CO-04 / D-50: results-active mode → FAB скрывается; X в sheet header'е закрывает.
  if (from !== null || dest !== null) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Где припарковаться?"
        onClick={() => setOpen(true)}
        style={{ zIndex: Z_INDEX.wtpFabMobile }}
        className="absolute right-4 bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] lg:hidden"
      >
        <Locate size={24} aria-hidden />
      </button>
      <PreFlightDrawer open={open} onOpenChange={setOpen} onManualEntry={handleManual} />
    </>
  );
}
