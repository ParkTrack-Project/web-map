// TIME-03 / D-01 / D-03: Desktop top-strip ВЫШЕ FiltersToolbar.
// Glassmorphism: bg-white/85 backdrop-blur с тонким border-bottom — floating
// effect над картой, без агрессивного emerald-50 фона из v1.
//
// Pill+Reset теперь живут внутри Content (не дублируются на strip), что
// убирает визуальный шум справа. Strip — просто тонкий контейнер для Content.
//
// Wiring в DesktopLayout — Plan 04 Task 1.
import { TimeSelectorContent } from './TimeSelectorContent';

export function TimeSelectorStrip() {
  return (
    <div
      role="toolbar"
      aria-label="Селектор времени"
      className="hidden border-b border-zinc-200/70 bg-white/85 backdrop-blur-md lg:block"
    >
      <div className="mx-auto max-w-5xl">
        <TimeSelectorContent />
      </div>
    </div>
  );
}
