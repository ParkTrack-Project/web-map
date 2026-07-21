// TIME-03 mobile / D-02 / D-04:
// Vaul snap[0.92] — single-snap. Multi-snap без controlled activeSnapPoint
// ломает vaul body-state: даже после dismiss следующий Drawer (MobileZoneCard)
// не открывается. Single snap = reliable.
import { Drawer } from 'vaul';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { TimeSelectorContent } from './TimeSelectorContent';
import { useI18n } from '@/shared/lib/i18n';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileTimeSelectorSheet({ open, onOpenChange }: Props) {
  const { t } = useI18n();
  // Phase 5 D-03: keyboard-aware sizing — datetime-local input на mobile тянет keyboard.
  useVisualViewportHeight();
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl outline-none lg:hidden"
          aria-describedby={undefined}
          style={{ maxHeight: 'calc(var(--keyboard-aware-height, 100dvh) - 80px)' }}
        >
          <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-zinc-300" aria-hidden />
          <Drawer.Title className="px-5 pt-2 pb-1 text-base font-semibold text-zinc-900">
            {t('time.title')}
          </Drawer.Title>
          <div className="overflow-y-auto pb-4">
            <TimeSelectorContent />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
