import { Apple, Download, ExternalLink, Play } from 'lucide-react';

type StoreLinkProps = {
  description: string;
  href: string;
  icon: typeof Play;
  title: string;
};

function StoreLink({ description, href, icon: Icon, title }: StoreLinkProps) {
  return (
    <a
      className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold text-zinc-900">{title}</span>
        <span className="mt-0.5 block text-sm text-zinc-600">{description}</span>
      </span>
      <ExternalLink aria-hidden="true" className="size-5 shrink-0 text-zinc-400 transition group-hover:text-emerald-600" />
    </a>
  );
}

export function AppPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-10 sm:px-6">
      <section aria-labelledby="app-page-title" className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-600/20">
            P
          </div>
          <h1 id="app-page-title" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            ParkTrack в вашем телефоне
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-6 text-zinc-600">
            Выберите удобный способ установить или открыть мобильное приложение.
          </p>
        </div>

        <div className="space-y-3">
          <StoreLink
            description="Установите приложение из официального магазина"
            href="https://play.google.com/store/apps/details?id=com.parktrack.mobile"
            icon={Play}
            title="Google Play — Android"
          />
          <StoreLink
            description="Загрузите последнюю версию приложения напрямую"
            href="https://github.com/ParkTrack-Project/mobile-app/releases/latest"
            icon={Download}
            title="Скачать APK — Android"
          />
          <StoreLink
            description="Откройте веб-приложение в Safari и добавьте на экран «Домой»"
            href="https://m.parktrack.live"
            icon={Apple}
            title="Открыть PWA — iOS"
          />
        </div>
      </section>
    </main>
  );
}
