// Phase 4 / WTP-03 / D-10:
// Mobile pre-flight через vaul Drawer — тот же текст, что в Dialog.
// Single-snap по умолчанию (Phase 3 pattern; Pitfall 11 — nested vaul / focus-trap conflict).
// Pure presentational — request flow lifted to parent (WTPMobileFAB) per Permissions API skip-logic.
//
// Fix 2026-05-26: убрана кнопка «Указать вручную» (по запросу продукта,
// синхронно с PreFlightDialog).
import { Drawer } from 'vaul';
import { Locate } from 'lucide-react';
import { useI18n } from '@/shared/lib/i18n';

interface PreFlightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void> | void;
}

export function PreFlightDrawer({ open, onOpenChange, onAllow }: PreFlightDrawerProps) {
  const { t } = useI18n();
  const handleAllow = async () => {
    const request = onAllow();
    onOpenChange(false);
    await request;
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto rounded-t-2xl bg-white p-5 outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
          <Drawer.Title className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Locate size={20} aria-hidden className="text-emerald-600" />
            {t('wtp.title')}
          </Drawer.Title>
          <p className="text-sm leading-relaxed text-zinc-700">{t('wtp.explainer')}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAllow}
              className="min-h-[44px] rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('wtp.allow')}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
