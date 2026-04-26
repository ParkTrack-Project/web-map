// Phase 4 / WTP-01 / D-08 / CO-01 (B-4 fix):
// Desktop primary CTA. Размещение per CO-01: top-4 left-32 (справа от TimeSelectorPopover
// в top-4 left-4); brand-green, lucide Locate, full label «Где припарковаться?».
// CO-01 supersedes D-04 «search inside TimeSelector strip» — strip заменён на floating
// popover в Phase 3, поэтому search/WTP/TimeSelector образуют единую top-4 строку.
// State (open) lifted внутри widget'а — компактнее чем prop drilling в layout.
// НЕ вызывает getCurrentPosition при mount (WTP-02 enforcement).
import { useState, useCallback } from 'react';
import { Locate } from 'lucide-react';
import { Z_INDEX } from '@/shared/config';
import { PreFlightDialog } from './PreFlightDialog';

interface WTPCTAButtonProps {
  /** Callback при «Указать вручную» — Layout использует для focus search-input. */
  onManualEntry?: () => void;
}

export function WTPCTAButton({ onManualEntry }: WTPCTAButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const handleManual = useCallback(() => onManualEntry?.(), [onManualEntry]);

  return (
    <>
      {/* CO-01: top-4 left-32 — справа от TimeSelectorPopover (top-4 left-4 ~120px wide).
          SearchBar займёт top-4 left-72 справа от этой кнопки. */}
      <button
        type="button"
        aria-label="Где припарковаться?"
        onClick={() => setOpen(true)}
        style={{ zIndex: Z_INDEX.wtpCtaDesktop }}
        className="absolute top-4 left-32 hidden items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] lg:inline-flex"
      >
        <Locate size={16} aria-hidden />
        Где припарковаться?
      </button>
      <PreFlightDialog open={open} onOpenChange={setOpen} onManualEntry={handleManual} />
    </>
  );
}
