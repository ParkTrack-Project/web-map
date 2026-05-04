/**
 * Phase 5 D-12 (INTEG-04): Single source of truth для всех цветов, шрифтов, spacing.
 *
 * Unification: объединение разбросанных hex'ов из Phase 2 (zone-palette, focus ring),
 * Phase 4 (brand-green primary, amber best-variant, route polyline).
 *
 * Migration path к UI-kit Миши: меняем значения здесь, ВСЕ consumers (shared/ui
 * primitives, Tailwind theme через @theme в index.css, inline styles в widgets)
 * автоматически подхватят. Когда Misha published `@parktrack/ui-kit`:
 *   1. Заменить эти значения на re-export из ui-kit
 *   2. Заменить shared/ui/Toast,Banner,StubHeader → импорт из ui-kit
 *   3. Готово — no cascading rewrites в widgets/features.
 *
 * Tailwind 4 native: `index.css` содержит соответствующий @theme directive,
 * который превращает эти hex'ы в utility classes (bg-brand-green-500 etc.).
 */
export const brand = {
  green: {
    50: '#f0fdf4',
    500: '#16a34a', // brand primary — focus ring, CTA, success polygon, route polyline
    600: '#15803d',
    900: '#14532d',
  },
  amber: {
    400: '#fbbf24', // best-variant glow (Phase 4 D-21)
    500: '#f59e0b',
  },
  neutral: {
    50: '#f9fafb',
    200: '#e5e7eb',
    700: '#374151',
    900: '#111827',
  },
  semantic: {
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626',
  },
} as const;

// Re-export zone-palette (Phase 2 D-01) — zone-specific palette остаётся отдельно,
// так как её 5 hex выбраны вручную для colorblind-safety + alpha balance.
// brand-tokens задаёт primary/semantic, zonePalette — domain-specific.
export { zonePalette, CONFIDENCE_THRESHOLD } from './zone-palette';
