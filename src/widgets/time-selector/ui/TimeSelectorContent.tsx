// TIME-03 / Quick task 260426-hhb (SUPERSEDES D-03):
// Single picker — без segmented control past/now/future.
//
// Структура:
//   - Один <input type="datetime-local"> ВСЕГДА видим (пустое значение когда mode=now)
//   - Объединённый chip-список (PRESETS из Task 1) ВСЕГДА видим
//   - Reset «Сейчас» CTA — conditional, появляется только когда mode != now
//   - Inline out-of-range message (D-10) — role="status" data-testid="out-of-range-msg"
//
// Mode derivation: setMode принимает derived mode через deriveMode(at, Date.now()).
// Tap по chip → applyPreset → setMode(deriveMode(at)).
// Tap по input → onChange → inputValueToUtcIso → setMode(deriveMode(iso)).
//
// B-4 sustainability: input min/max мемоизированы по «mount-once» паттерну —
// никаких new strings на каждый rerender (mobile webkit teardown'ит controlled input).
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { X, CalendarClock } from 'lucide-react';
import { useTimeMode } from '@/features/select-time-mode';
import { MAX_PAST_DAYS, MAX_FUTURE_HOURS, MIN_RESOLUTION_MINUTES } from '@/shared/config';
import { inputValueToUtcIso, utcIsoToInputValue } from '@/shared/lib/i18n';
import { deriveMode } from '@/shared/lib/url';
import { PRESETS, applyPreset, type Preset } from '../lib/presets';
import { formatBoundMessage } from '../lib/bounds';

export function TimeSelectorContent() {
  const { mode, setMode, setNow } = useTimeMode();
  const [outOfRangeMsg, setOutOfRangeMsg] = useState<string | null>(null);
  // Active preset label — для визуальной подсветки выбранной chip-кнопки.
  // Сбрасывается при ручном вводе времени или Reset (значит preset больше
  // не отражает текущий mode.at).
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(null);

  const isModeChosen = mode.kind !== 'now';

  const onPreset = (preset: Preset) => {
    const r = applyPreset(preset);
    const next = deriveMode(r.at);
    setMode(next);
    setOutOfRangeMsg(r.outOfRangeMsg);
    setActivePresetLabel(preset.label);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const local = e.target.value;
    if (!local) {
      // Очистка input → возвращаем к now
      setNow();
      setOutOfRangeMsg(null);
      setActivePresetLabel(null);
      return;
    }
    try {
      const iso = inputValueToUtcIso(local);
      const next = deriveMode(iso);
      setMode(next);
      setOutOfRangeMsg(null);
      setActivePresetLabel(null);
    } catch {
      // Кинд для message: derived из текущего mode (если уже выбрано),
      // иначе fallback к 'past' для bound-message (тривиальный edge case).
      const k = mode.kind === 'future' ? 'future' : 'past';
      setOutOfRangeMsg(formatBoundMessage(k));
    }
  };

  const onReset = () => {
    setOutOfRangeMsg(null);
    setActivePresetLabel(null);
    setNow();
  };

  // B-4: input bounds + default-now мемоизированы — никаких new strings на каждый rerender
  // (mobile webkit teardown'ит controlled input при flux-strings).
  // Mount-once: вычисляются единожды при первом рендере; deps пустые.
  // defaultNowValue показывается в input когда mode=now — UX-affordance, чтобы
  // пользователь сразу видел «вот моё текущее время, могу его подвинуть».
  const { inputMin, inputMax, defaultNowValue } = useMemo(() => {
    const now = Date.now();
    return {
      inputMin: utcIsoToInputValue(new Date(now - MAX_PAST_DAYS * 86_400_000).toISOString()),
      inputMax: utcIsoToInputValue(new Date(now + MAX_FUTURE_HOURS * 3_600_000).toISOString()),
      defaultNowValue: utcIsoToInputValue(new Date(now).toISOString()),
    };
  }, []);

  const inputValue = isModeChosen && 'at' in mode ? utcIsoToInputValue(mode.at) : defaultNowValue;
  const pastPresets = PRESETS.filter((preset) =>
  preset.type === 'static' ? preset.deltaMs < 0 : preset.dayOffset < 0,
);

const futurePresets = PRESETS.filter((preset) =>
  preset.type === 'static' ? preset.deltaMs > 0 : preset.dayOffset > 0,
);

const renderPresetButton = (preset: Preset) => {
  const isActivePreset = activePresetLabel === preset.label;

  return (
    <button
      key={preset.label}
      type="button"
      onClick={() => onPreset(preset)}
      aria-pressed={isActivePreset}
      className={
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ' +
        (isActivePreset
          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/40'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900')
      }
    >
      {preset.label}
    </button>
  );
};

  return (
    <div className="flex flex-col gap-3 p-4" data-testid="time-selector-content">
      {/* DateTime input с calendar icon prefix */}
      <div className="relative">
        <CalendarClock
          size={14}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="datetime-local"
          value={inputValue}
          min={inputMin}
          max={inputMax}
          step={MIN_RESOLUTION_MINUTES * 60}
          onChange={onInputChange}
          aria-label="Выберите точное время"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-[13px] font-medium text-zinc-800 shadow-xs transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
        />
      </div>

      {/* Preset chips — всегда видим объединённый список (5 past + 5 future) */}
      {/* Preset chips — прошлое и будущее отдельно */}
      <div aria-label="Быстрый выбор времени" className="flex flex-col gap-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Прошлое</div>
        <div role="group" aria-label="Прошлое" className="flex flex-wrap gap-1.5">
          {pastPresets.map(renderPresetButton)}
        </div>

        <div className="h-px w-full bg-zinc-200" aria-hidden="true"/>

        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Будущее</div>
        <div role="group" aria-label="Будущее" className="flex flex-wrap gap-1.5">
          {futurePresets.map(renderPresetButton)}
        </div>
      </div>

      {/* Reset «Сейчас» CTA — только когда mode != now */}
      {isModeChosen && (
          <button
          type="button"
          onClick={onReset}
          aria-label="Вернуться к Сейчас"
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <X size={12} aria-hidden />
          Вернуться к Сейчас
        </button>
      )}
    </div>
  );
}
