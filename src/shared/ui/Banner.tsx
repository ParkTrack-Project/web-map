// Phase 5 D-13 (UX-05): inline banner для cases где Sonner toast не достигает
// (например, внутри vaul Drawer с focus trap — Pitfall 3).
//
// Usage:
//   <Banner variant="error" onDismiss={() => clearError()}>
//     Не удалось загрузить детали зоны
//   </Banner>
//
// 44x44 tap target на dismiss-кнопке (Plan 05-01 RESP-06 / WCAG 2.5.5).
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useI18n } from '@/shared/lib/i18n';

export interface BannerProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BannerProps['variant']>, string> = {
  error: 'bg-red-50 text-red-900 border-red-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200',
  success: 'bg-brand-green-50 text-brand-green-900 border-brand-green-500',
};

export function Banner({ variant = 'info', children, onDismiss, className }: BannerProps) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-2 min-h-11 min-w-11 p-2 leading-none text-current opacity-60 hover:opacity-100"
          aria-label={t('common.close')}
        >
          ×
        </button>
      )}
    </div>
  );
}
