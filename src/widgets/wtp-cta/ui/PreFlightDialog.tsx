// Phase 4 / WTP-03 / D-10:
// Desktop pre-flight modal через @radix-ui/react-dialog.
// Текст из CONTEXT D-10 verbatim. Brand-green primary, secondary outline для manual entry.
import * as Dialog from '@radix-ui/react-dialog';
import { Locate } from 'lucide-react';
import { useGeolocationRequest, useFromCoords } from '@/features/request-geolocation';

interface PreFlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManualEntry: () => void; // closes dialog + focuses search-input в parent (D-10)
}

const EXPLAINER_TEXT =
  'Для поиска ближайших парковок нужен доступ к вашей геолокации. Координаты используются только для запроса к серверу и не сохраняются.';

export function PreFlightDialog({ open, onOpenChange, onManualEntry }: PreFlightDialogProps) {
  const { request } = useGeolocationRequest();
  const { setFromCoords } = useFromCoords();

  const handleAllow = async () => {
    const coords = await request();
    if (coords) {
      setFromCoords(coords);
    }
    // Close dialog независимо от исхода — denied/timeout state читается через banner.
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-1/2 left-1/2 z-[60] w-[420px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none">
          <Dialog.Title className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Locate size={20} aria-hidden className="text-emerald-600" />
            Где припарковаться?
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-relaxed text-zinc-700">
            {EXPLAINER_TEXT}
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAllow}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Разрешить геолокацию
            </button>
            <button
              type="button"
              onClick={() => {
                onManualEntry();
                onOpenChange(false);
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Указать вручную
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
