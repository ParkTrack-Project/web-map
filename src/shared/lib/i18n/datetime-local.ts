// Pitfall #6: <input type="datetime-local"> возвращает локальное время БЕЗ TZ.
// URL хранит UTC ISO — нужны двусторонние конвертеры.
// НЕ использовать getUTC* в utcIsoToInputValue — input ждёт LOCAL значение.

// "2026-04-25T17:00" (local, без TZ) → "2026-04-25T14:00:00.000Z" (UTC, MSK +3)
export function inputValueToUtcIso(local: string): string {
  // new Date('2026-04-25T17:00') интерпретируется как local time
  // (без TZ-suffix — это спецификация ECMAScript для datetime-local-формы).
  return new Date(local).toISOString();
}

// "2026-04-25T14:00:00.000Z" → "2026-04-25T17:00" (для input value/min/max)
export function utcIsoToInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  // ВАЖНО: getMonth/getDate/getHours/getMinutes — local-time getters.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
