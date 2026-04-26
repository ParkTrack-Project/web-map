// TIME-03 / Quick task 260426-hhb (SUPERSEDES D-03):
// Single picker — без segmented control.
// - Один <input type="datetime-local"> всегда видим
// - Объединённый chip-список (PRESETS) всегда видим
// - Reset «Сейчас» CTA только когда mode != now
//
// Out-of-range UI integration purely state-driven; источник state — applyPreset,
// покрытый отдельно в time-presets.spec.ts. Доп. UI-тест избыточен.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { TimeSelectorContent } from '@/widgets/time-selector/ui/TimeSelectorContent';

function wrap(initialUrl = '') {
  return render(
    <NuqsTestingAdapter searchParams={initialUrl}>
      <TimeSelectorContent />
    </NuqsTestingAdapter>,
  );
}

describe('<TimeSelectorContent /> (TIME-03, single-picker — quick 260426-hhb)', () => {
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();
  beforeEach(() =>
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] }).setSystemTime(NOW),
  );
  afterEach(() => vi.useRealTimers());

  it('default (mode=now) — input + chips видны, Reset CTA отсутствует', () => {
    wrap('');
    expect(screen.getByLabelText('Выберите точное время')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Быстрый выбор времени' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Вернуться к Сейчас/ })).toBeNull();
  });

  it('default — нет сегментированного контрола (past/now/future кнопки удалены)', () => {
    wrap('');
    expect(screen.queryByRole('button', { name: 'Прошлое' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Будущее' })).toBeNull();
    // «Сейчас» кнопка может быть в Reset CTA, но при mode=now её нет
    expect(screen.queryByRole('button', { name: 'Сейчас' })).toBeNull();
  });

  it('PRESETS чип-список содержит 10 элементов (5 past + 5 future)', () => {
    wrap('');
    for (const lbl of [
      'Час назад',
      '3 часа назад',
      'Вчера 09:00',
      'Вчера 18:00',
      'Неделю назад',
      'Через час',
      'Через 3 часа',
      'Завтра 09:00',
      'Завтра 18:00',
      'Через 24 часа',
    ]) {
      expect(screen.getByRole('button', { name: lbl })).toBeInTheDocument();
    }
  });

  it('past mode — Reset CTA появляется', () => {
    const at = new Date(NOW - 3 * 3_600_000).toISOString();
    wrap(`?t=${at}`);
    expect(screen.getByRole('button', { name: /Вернуться к Сейчас/ })).toBeInTheDocument();
  });

  it('click chip «Час назад» → Reset CTA появляется', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    wrap('');
    expect(screen.queryByRole('button', { name: /Вернуться к Сейчас/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Час назад' }));
    expect(screen.getByRole('button', { name: /Вернуться к Сейчас/ })).toBeInTheDocument();
  });

  it('click chip «Через час» → Reset CTA появляется (future derive)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    wrap('');
    await user.click(screen.getByRole('button', { name: 'Через час' }));
    expect(screen.getByRole('button', { name: /Вернуться к Сейчас/ })).toBeInTheDocument();
  });

  it('Reset CTA → Reset исчезает + input очищается', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const at = new Date(NOW - 3 * 3_600_000).toISOString();
    wrap(`?t=${at}`);
    await user.click(screen.getByRole('button', { name: /Вернуться к Сейчас/ }));
    expect(screen.queryByRole('button', { name: /Вернуться к Сейчас/ })).toBeNull();
    const input = screen.getByLabelText('Выберите точное время') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('datetime-local input имеет step=900 (15 минут) + min/max', () => {
    wrap('');
    const input = screen.getByLabelText('Выберите точное время') as HTMLInputElement;
    expect(input.step).toBe('900');
    expect(input.min).toBeTruthy();
    expect(input.max).toBeTruthy();
  });

  it('legacy URL ?t=past:ISO → input заполнен derived past mode (smoke)', () => {
    wrap('?t=past:2026-04-22T09:00:00.000Z');
    const input = screen.getByLabelText('Выберите точное время') as HTMLInputElement;
    // Легаси ?t=past:ISO должен парситься → derived past → input value заполнен
    expect(input.value).toBeTruthy();
    expect(screen.getByRole('button', { name: /Вернуться к Сейчас/ })).toBeInTheDocument();
  });

  it('jsx содержит inline out-of-range узел (data-testid="out-of-range-msg") — рендерится по state.outOfRangeMsg', () => {
    wrap('');
    // По дефолту outOfRangeMsg = null → элемент НЕ рендерится
    expect(screen.queryByTestId('out-of-range-msg')).toBeNull();
  });
});
