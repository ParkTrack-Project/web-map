export const brand = {
  green: {
    50: '#f0fdf4',
    500: '#16a34a', // brand primary — focus ring, CTA, success polygon, route polyline
    600: '#15803d',
    900: '#14532d',
  },
  amber: {
    400: '#fbbf24',
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

export { zonePalette, CONFIDENCE_THRESHOLD } from './zone-palette';
