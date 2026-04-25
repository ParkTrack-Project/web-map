// ZONE-05 / D-03: collapsible <details>-карточка в bottom-left.
// По умолчанию развёрнута (новый пользователь должен сразу понять цвета).
// На мобильном maxHeight 40vh с внутренним скроллом — не перекрывает карту.
import { zonePalette } from '@/shared/config';

interface Swatch {
  color: string;
  label: string;
}

const SWATCHES: Swatch[] = [
  { color: zonePalette.freeHigh.fill, label: 'Свободно, данные свежие' },
  { color: zonePalette.freeLow.fill, label: 'Свободно, данные старые' },
  { color: zonePalette.one.fill, label: '1 место' },
  { color: zonePalette.full.fill, label: 'Нет мест' },
  { color: zonePalette.inactive.fill, label: 'Неактивна / нет данных' },
];

export function Legend() {
  return (
    <details
      open
      className="absolute bottom-4 left-4 z-20 max-w-xs rounded-lg bg-white/95 shadow-lg lg:max-w-sm"
      style={{ maxHeight: '40vh', overflowY: 'auto' }}
    >
      <summary
        className="cursor-pointer list-none p-3 font-semibold"
        aria-label="Свернуть или развернуть легенду"
      >
        Легенда
      </summary>
      <ul className="space-y-2 px-3 pb-3 text-sm">
        {SWATCHES.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded border border-zinc-300"
              style={{ background: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
        <li className="pt-2 text-xs text-zinc-600">
          «Уверенность» — насколько свежи данные о занятости (источник: камеры обновляются ~раз в
          минуту)
        </li>
      </ul>
    </details>
  );
}
