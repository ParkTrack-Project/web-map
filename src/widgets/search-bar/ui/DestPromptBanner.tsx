// Phase 4 / CO-03 / W-1 fix:
// Inline prompt-banner: показывается когда ?dest set но ?from === null.
// EXACT текст per CO-03: «Нажмите [Где припарковаться?] или укажите стартовую точку, чтобы найти парковки».
// Возвращает null когда ?from set (panel откроется) или когда нет ни ?from ни ?dest.
// Mounting site: рядом с DesktopSearchBar в DesktopLayout, и в top-bar MobileLayout.
import { Locate } from 'lucide-react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';

export function DestPromptBanner() {
  const { from } = useFromCoords();
  const { dest } = useDestination();
  // Показываем ТОЛЬКО когда есть destination, но нет origin.
  if (from !== null || dest === null) return null;
  return (
    <div
      role="status"
      data-testid="dest-prompt-banner"
      className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200"
    >
      <Locate size={14} aria-hidden className="text-amber-700" />
      <span>Нажмите [Где припарковаться?] или укажите стартовую точку, чтобы найти парковки</span>
    </div>
  );
}
