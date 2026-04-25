// MAP-07: изолирует падения ymaps3 (CDN-блок, истёкший ключ, top-level-await throw).
// Покажет текстовый fallback с кнопкой «Перезагрузить карту» вместо пустого экрана.
// В Phase 2 здесь же будет рендериться list-only fallback.
import { ErrorBoundary } from 'react-error-boundary';
import type { PropsWithChildren } from 'react';

function MapFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-neutral-50 p-8"
    >
      <h2 className="text-lg font-semibold">Карта недоступна</h2>
      <p className="max-w-sm text-center text-sm text-neutral-600">
        Не удалось загрузить Яндекс Карты. Проверьте подключение и попробуйте ещё раз.
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-100"
      >
        Перезагрузить карту
      </button>
      <p className="text-xs text-neutral-400">Список парковок будет здесь в будущем (fallback)</p>
    </div>
  );
}

export function MapErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      FallbackComponent={MapFallback}
      onError={(e) => console.error('[MapErrorBoundary] ymaps3 failed:', e)}
    >
      {children}
    </ErrorBoundary>
  );
}
