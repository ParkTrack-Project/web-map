// Phase 5 D-13 (UX-05): project-standard toast API.
// Wraps sonner так что widgets/features импортят `toast` из `@/shared/ui` —
// vendor-swap (например, на Misha UI-kit) = single-file change здесь.
//
// Usage:
//   import { toast } from '@/shared/ui';
//   toast.error('Не удалось загрузить парковки', {
//     action: { label: 'Повторить', onClick: () => refetch() },
//   });
//   toast.warning('Поиск временно недоступен');
//   toast.success('Маршрут построен');
export { toast } from 'sonner';
export type { ExternalToast } from 'sonner';
