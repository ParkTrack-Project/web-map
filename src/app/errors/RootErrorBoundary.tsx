// Граница ошибок верхнего уровня. Падения внутри React-tree (например, ymaps3 fail
// или unexpected throw в провайдерах) больше не обрушивают весь app — пользователь
// видит fallback с кнопкой «Перезагрузить».
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { PropsWithChildren } from 'react';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="p-8">
      <h1 className="text-xl font-semibold">Что-то сломалось</h1>
      <pre className="mt-2 text-sm whitespace-pre-wrap">{message}</pre>
      <button type="button" onClick={resetErrorBoundary} className="mt-4 rounded border px-3 py-1">
        Перезагрузить
      </button>
    </div>
  );
}

export function RootErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(e) => console.error('[RootErrorBoundary]', e)}
    >
      {children}
    </ErrorBoundary>
  );
}
