// D-01: 5-цветная OkLCH-сбалансированная палитра, colorblind-safe (Deuteranopia +
// Protanopia). Hex'ы выбраны вручную с alpha для fill, solid для stroke.
// Контрастность бейджа на жёлтом / светло-зелёном требует непрозрачного белого
// фона (D-20 — реализуется в ZoneBadgesLayer).
// Phase 5: UI-kit Миши заменит values, не consumers — палитра подключается только
// через named tokens, поэтому замена value не сломает downstream.
export const zonePalette = {
  // is_active=false / нет данных
  inactive: { fill: '#9ca3af8c', stroke: '#4b5563' },
  // free_count=0
  full: { fill: 'rgba(216,22,22,0.59)', stroke: '#cd2b2b' },
  // free_count=1 — янтарный (НЕ чистый жёлтый, путается с белым на ярких подложках)
  one: { fill: 'rgba(245,171,11,0.59)', stroke: '#b48409' },
  // free_count>=2 && confidence < CONFIDENCE_THRESHOLD
  freeLow: { fill: '#86efac96', stroke: '#2d8714' },
  // free_count>=2 && confidence >= CONFIDENCE_THRESHOLD — ParkTrack brand green
  freeHigh: { fill: '#16a34aaa', stroke: '#155e2a' },
  // D-08 — outer-glow для selected zone (альфа 0.3 на brand-green)
  selected: { stroke: '#16a34a', glow: '#16a34a4d' },
} as const;

export const CONFIDENCE_THRESHOLD = 0.75;
