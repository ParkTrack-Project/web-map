// Phase 4 / WTP-03 / D-10:
// Desktop pre-flight modal через @radix-ui/react-dialog.
// Текст из CONTEXT D-10 verbatim. Brand-green primary CTA.
// Pure presentational — request flow lifted to parent (WTPCTAButton) чтобы Permissions API
// мог пропустить pre-flight при state='granted' и переиспользовать тот же request handler.
//
// Fix 2026-05-26: убрана secondary-кнопка «Указать вручную» (по запросу
// продукта). Manual entry остаётся доступен через поиск в шапке карты —
// дублирующий путь в pre-flight'е не нужен.
import * as Dialog from '@radix-ui/react-dialog';
import { Locate } from 'lucide-react';

interface PreFlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void> | void; // owned by parent (WTPCTAButton)
}

const EXPLAINER_TEXT =
  'Для поиска ближайших парковок нужен доступ к вашей геолокации. Координаты используются только для запроса к серверу и не сохраняются.';

export function PreFlightDialog({ open, onOpenChange, onAllow }: PreFlightDialogProps) {
  const handleAllow = async () => {
    await onAllow();
    // Close dialog независимо от исхода — denied/timeout state читается через banner.
    onOpenChange(false);
  };

  return (
    // Fix 2026-05-30: modal={false}. Modal Radix-диалог вешает `pointer-events: none`
    // на <body> и после закрытия с async-действием (запрос геолокации + нативный
    // browser-prompt) иногда НЕ снимает его → вся страница перестаёт ловить клики
    // («Где припарковаться?» мертва, оживает только после движения карты —
    // случайный re-layout). Non-modal не лочит body вовсе. Оверлей делаем
    // pointer-events-none: он лишь затемняет фон, но не блокирует карту/кнопки.
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-none fixed inset-0 z-[60] bg-black/40" />
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
