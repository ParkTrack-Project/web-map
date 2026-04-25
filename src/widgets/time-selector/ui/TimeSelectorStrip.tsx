// TIME-03 / D-01 / D-03: Desktop top-strip ВЫШЕ FiltersToolbar.
// 64px высота (примерно — auto-fit), bg-emerald-50/50 + border-bottom для
// визуальной prominence (это дифференциатор продукта).
//
// Правая часть: pill-метка с локализованным временем (formatTimeLabelRu) +
// duplicate Reset CTA — для quick access на самой strip без открытия Content.
// Reset рендерится только когда mode != now.
//
// Wiring в DesktopLayout — Plan 04 Task 1.
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabelRu } from '@/shared/lib/i18n';
import { TimeSelectorContent } from './TimeSelectorContent';

export function TimeSelectorStrip() {
  const { mode, setNow } = useTimeMode();
  const isModeChosen = mode.kind !== 'now';

  return (
    <div
      role="toolbar"
      aria-label="Селектор времени"
      className="hidden items-stretch border-b border-emerald-200 bg-emerald-50/50 lg:flex"
    >
      {/* Слева/центрально: segment + presets + input + reset (через Content) */}
      <div className="flex-1">
        <TimeSelectorContent />
      </div>

      {/* Справа: пилюля с конкретным временем (D-03) — visible только когда mode != now */}
      {isModeChosen && (
        <div className="flex items-center gap-3 border-l border-emerald-200 px-4">
          <span
            aria-live="off"
            className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900"
          >
            {formatTimeLabelRu(mode)}
          </span>
          <button
            type="button"
            onClick={setNow}
            className="rounded-md border border-emerald-600 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Вернуться к Сейчас
          </button>
        </div>
      )}
    </div>
  );
}
