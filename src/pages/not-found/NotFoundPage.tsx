import { ArrowLeft, MapPinned } from 'lucide-react';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-10 sm:px-6">
      <section aria-labelledby="not-found-page-title" className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
          <MapPinned aria-hidden="true" className="size-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ошибка 404</p>
        <h1 id="not-found-page-title" className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-6 text-zinc-600">
          Возможно, ссылка устарела или адрес был введён с ошибкой.
        </p>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          to="/map"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Вернуться к карте
        </Link>
      </section>
    </main>
  );
}
