// TIME-03 mobile / D-02 / D-04:
// Vaul snap[0.92] — single-snap. Multi-snap без controlled activeSnapPoint
// ломает vaul body-state: даже после dismiss следующий Drawer (MobileZoneCard)
// не открывается. Single snap = reliable.
import { Drawer } from 'vaul';
import { TimeSelectorContent } from './TimeSelectorContent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileTimeSelectorSheet({ open, onOpenChange }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-zinc-300" aria-hidden />
          <Drawer.Title className="px-5 pt-2 pb-1 text-base font-semibold text-zinc-900">
            Время
          </Drawer.Title>
          <div className="overflow-y-auto pb-4">
            <TimeSelectorContent />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
