// Pitfall #6: datetime-local helpers — local↔UTC roundtrip без off-by-tz ошибок.
// «2026-04-25T17:00» (local) → ISO UTC → обратно в «2026-04-25T17:00» (для input).
import { describe, it, expect } from 'vitest';
import { inputValueToUtcIso, utcIsoToInputValue } from '@/shared/lib/i18n';

describe('datetime-local helpers (Pitfall #6)', () => {
  it('inputValueToUtcIso("2026-04-25T17:00") → ISO с тем же абсолютным timestamp', () => {
    const out = inputValueToUtcIso('2026-04-25T17:00');
    // Не Z строка фиксированная (зависит от TZ окружения теста), но абсолютный момент совпадает.
    expect(new Date(out).getTime()).toBe(new Date('2026-04-25T17:00').getTime());
  });

  it('utcIsoToInputValue + inputValueToUtcIso roundtrip — bit-identical', () => {
    const local = '2026-04-25T17:00';
    const iso = inputValueToUtcIso(local);
    const back = utcIsoToInputValue(iso);
    expect(back).toBe(local);
  });

  it('utcIsoToInputValue форма "YYYY-MM-DDTHH:mm" (no seconds, no TZ)', () => {
    const out = utcIsoToInputValue(new Date('2026-04-25T17:00').toISOString());
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('inputValueToUtcIso возвращает Z-suffix ISO', () => {
    const out = inputValueToUtcIso('2026-04-25T00:00');
    expect(out).toMatch(/Z$/);
  });

  it('roundtrip для произвольной local datetime — bit-identical', () => {
    const samples = [
      '2026-01-01T00:00',
      '2026-06-15T12:30',
      '2026-12-31T23:45',
      '2026-04-25T17:00',
    ];
    for (const local of samples) {
      const iso = inputValueToUtcIso(local);
      const back = utcIsoToInputValue(iso);
      expect(back).toBe(local);
    }
  });
});
