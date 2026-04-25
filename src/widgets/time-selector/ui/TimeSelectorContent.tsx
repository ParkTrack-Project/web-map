// TIME-03 / D-03 / D-05/D-06/D-07/D-10:
// Shared body для desktop strip и mobile sheet — единая визуальная композиция.
// - 3 segment-buttons (mode kind switch)
// - preset chips (past или future, в зависимости от текущего kind)
// - datetime-local input с min/max/step (D-05)
// - inline out-of-range message (D-10) — role="status" для SR
// - Reset CTA «Вернуться к Сейчас» (D-03)
// Apply кнопки нет (D-07) — изменения live.
//
// B-4: input min/max/value мемоизируются по kind, чтобы избежать
// controlled-value rebreak'а на каждый rerender (mobile webkit teardown).
import { useMemo, useState } from 'react';
import type { ChangeEvent, ComponentType } from 'react';
import { Clock, History, TrendingUp, RotateCcw } from 'lucide-react';
import { useTimeMode } from '@/features/select-time-mode';
import {
  MAX_PAST_DAYS,
  MAX_FUTURE_HOURS,
  MIN_RESOLUTION_MINUTES,
} from '@/shared/config';
import { inputValueToUtcIso, utcIsoToInputValue } from '@/shared/lib/i18n';
import { PRESETS_PAST, PRESETS_FUTURE, applyPreset, type Preset } from '../lib/presets';
import { formatBoundMessage } from '../lib/bounds';
import type { TimeMode } from '@/entities/zone';

function modeKind(mode: TimeMode): 'past' | 'now' | 'future' {
  return mode.kind;
}

interface SegmentBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
}

function SegmentBtn({ active, onClick, label, Icon }: SegmentBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ' +
        (active
          ? 'bg-emerald-600 font-semibold text-white'
          : 'bg-white text-zinc-700 hover:bg-zinc-100')
      }
    >
      <Icon size={14} aria-hidden />
      {label}
    </button>
  );
}

export function TimeSelectorContent() {
  const { mode, setMode, setNow } = useTimeMode();
  const [outOfRangeMsg, setOutOfRangeMsg] = useState<string | null>(null);

  const kind = modeKind(mode);
  const isModeChosen = kind !== 'now';

  const onSegment = (target: 'past' | 'now' | 'future') => {
    setOutOfRangeMsg(null);
    if (target === 'now') {
      setNow();
      return;
    }
    const now = Date.now();
    const at = target === 'past' ? now - 3_600_000 : now + 3_600_000;
    setMode({ kind: target, at: new Date(at).toISOString() });
  };

  const onPreset = (preset: Preset) => {
    if (kind === 'now') return;
    const r = applyPreset(preset, kind);
    setMode(r.mode);
    setOutOfRangeMsg(r.outOfRangeMsg);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (kind === 'now') return;
    const local = e.target.value;
    if (!local) return;
    try {
      const iso = inputValueToUtcIso(local);
      setMode({ kind, at: iso });
      setOutOfRangeMsg(null);
    } catch {
      setOutOfRangeMsg(formatBoundMessage(kind));
    }
  };

  // B-4: input bounds мемоизированы по kind — никаких new strings на каждый rerender
  const { inputMin, inputMax, nowInput } = useMemo(() => {
    const now = Date.now();
    return {
      inputMin: utcIsoToInputValue(new Date(now - MAX_PAST_DAYS * 86_400_000).toISOString()),
      inputMax: utcIsoToInputValue(new Date(now + MAX_FUTURE_HOURS * 3_600_000).toISOString()),
      nowInput: utcIsoToInputValue(new Date(now).toISOString()),
    };
  }, [kind]);

  const effectiveInputMin = kind === 'past' ? inputMin : nowInput;
  const effectiveInputMax = kind === 'past' ? nowInput : inputMax;
  const inputValue = isModeChosen && 'at' in mode ? utcIsoToInputValue(mode.at) : '';
  const presets = kind === 'past' ? PRESETS_PAST : kind === 'future' ? PRESETS_FUTURE : [];

  return (
    <div className="flex flex-col gap-3 p-4" data-testid="time-selector-content">
      {/* Segmented control */}
      <div
        role="group"
        aria-label="Режим времени"
        className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1"
      >
        <SegmentBtn
          active={kind === 'past'}
          onClick={() => onSegment('past')}
          label="Прошлое"
          Icon={History}
        />
        <SegmentBtn
          active={kind === 'now'}
          onClick={() => onSegment('now')}
          label="Сейчас"
          Icon={Clock}
        />
        <SegmentBtn
          active={kind === 'future'}
          onClick={() => onSegment('future')}
          label="Будущее"
          Icon={TrendingUp}
        />
      </div>

      {/* Preset chips + datetime input + reset (только когда mode != now) */}
      {isModeChosen && (
        <>
          <div
            role="group"
            aria-label="Быстрый выбор времени"
            className="flex flex-wrap gap-1.5"
          >
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onPreset(p)}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs hover:border-emerald-500 hover:bg-emerald-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Точное время
            <input
              type="datetime-local"
              value={inputValue}
              min={effectiveInputMin}
              max={effectiveInputMax}
              step={MIN_RESOLUTION_MINUTES * 60}
              onChange={onInputChange}
              aria-label="Выберите точное время"
              className="rounded-md border border-zinc-300 px-2 py-1.5"
            />
          </label>

          {outOfRangeMsg && (
            <p
              role="status"
              className="text-xs text-amber-700"
              data-testid="out-of-range-msg"
            >
              {outOfRangeMsg}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setOutOfRangeMsg(null);
              setNow();
            }}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <RotateCcw size={14} aria-hidden />
            Вернуться к Сейчас
          </button>
        </>
      )}
    </div>
  );
}
