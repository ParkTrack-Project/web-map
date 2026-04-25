// TIME-03 mobile / D-02 / D-04:
// Vaul snap[0.95] sheet — single-snap (полный экран минус 5%), потому что
// весь selector сразу нужно видеть (нет «preview» режима как у zone-card).
// Drawer.Title даёт screen-reader announcement при открытии.
import { Drawer } from 'vaul';
import { TimeSelectorContent } from './TimeSelectorContent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileTimeSelectorSheet({ open, onOpenChange }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.95]} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[95dvh] flex-col rounded-t-2xl bg-white outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <Drawer.Title className="px-5 pt-4 text-lg font-semibold">Время</Drawer.Title>
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
          <div className="overflow-y-auto">
            <TimeSelectorContent />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
