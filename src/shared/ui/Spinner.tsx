export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center p-4">
      <div
        className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
