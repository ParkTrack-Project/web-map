import * as Dialog from '@radix-ui/react-dialog';
import { Locate } from 'lucide-react';
import { useI18n } from '@/shared/lib/i18n';

interface PreFlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void> | void; // owned by parent (WTPCTAButton)
}

export function PreFlightDialog({ open, onOpenChange, onAllow }: PreFlightDialogProps) {
  const { t } = useI18n();
  const handleAllow = async () => {
    // Запрос начинается в user gesture, а окно закрывается сразу: loading/error
    // остаются видимы на основной кнопке и в inline banner.
    const request = onAllow();
    onOpenChange(false);
    await request;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-none fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-1/2 left-1/2 z-[60] w-[420px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl outline-none">
          <Dialog.Title className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Locate size={20} aria-hidden className="text-emerald-600" />
            {t('wtp.title')}
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-relaxed text-zinc-700">
            {t('wtp.explainer')}
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAllow}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('wtp.allow')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
