// THE single load-bearing module touching window.ymaps3 (Anti-Pattern #5: больше нигде в src/
// нельзя ссылаться на window.ymaps3 — всё через этот barrel).
//
// FOUND-03: Yandex Maps API v3 загружается как runtime-only через CDN-script в index.html.
// Внешние пакеты UI-контролов НЕ импортируем обычным Vite import(...).
// Их нужно грузить через ymaps3.import(...), предварительно зарегистрировав CDN-loader.
//
// Pitfall #1 (imperative desync): location и другие "controlled" props НЕ применяются повторно.
// Используйте reactify.useDefault для controlled-биндингов или onUpdate-callback для чтения.
// При необходимости управления location снаружи — обновляйте через map ref напрямую,
// иначе React будет переписывать состояние карты.
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type Ymaps3ImportFn = {
  (packageName: string): Promise<unknown>;
  registerCdn: (urlMask: string, packages: string | string[]) => void;
};

type Ymaps3Runtime = object & {
  ready: Promise<unknown>;
  import: Ymaps3ImportFn;
};

type ReactifiedComponents = Record<string, React.ComponentType<Record<string, unknown>>>;

type ReactifyApi = {
  module: (module: object) => ReactifiedComponents;
  useDefault: <T>(value: T, deps?: readonly unknown[]) => T;
};

type Ymaps3ReactifyModule = {
  reactify: {
    bindTo: (react: typeof React, reactDOM: typeof ReactDOM) => ReactifyApi;
  };
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function runtimeMessage(ru: string, en: string): string {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? en : ru;
}

const ymaps3Global = (globalThis as unknown as { ymaps3?: Ymaps3Runtime }).ymaps3;

if (!ymaps3Global) {
  throw new Error(
    runtimeMessage(
      'Яндекс Карты не загрузились. Проверьте VPN и доступ к api-maps.yandex.ru / yastatic.net.',
      'Yandex Maps did not load. Check your VPN and access to api-maps.yandex.ru / yastatic.net.',
    ),
  );
}

// ВАЖНО.
// @yandex/ymaps3-default-ui-theme не имеет встроенного loader'а.
// Без registerCdn будет ошибка:
// "ymaps3.import: no loader for pkg @yandex/ymaps3-default-ui-theme".
ymaps3Global.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
  '@yandex/ymaps3-default-ui-theme@0.0',
]);

const [ymaps3React] = await Promise.all([
  withTimeout(
    ymaps3Global.import('@yandex/ymaps3-reactify') as Promise<Ymaps3ReactifyModule>,
    15_000,
    runtimeMessage(
      'Не удалось загрузить React-модуль Яндекс Карт. Возможная причина: VPN или блокировка yastatic.net.',
      'The Yandex Maps React module could not be loaded. A VPN or blocked yastatic.net may be the cause.',
    ),
  ),
  withTimeout(
    ymaps3Global.ready,
    15_000,
    runtimeMessage(
      'Яндекс Карты слишком долго загружаются. Возможная причина: VPN или блокировка yastatic.net.',
      'Yandex Maps is taking too long to load. A VPN or blocked yastatic.net may be the cause.',
    ),
  ),
]);

export const reactify = ymaps3React.reactify.bindTo(React, ReactDOM);

export const {
  YMap,
  YMapDefaultSchemeLayer,
  YMapDefaultFeaturesLayer,
  YMapFeature,
  YMapMarker,
  YMapListener,
  YMapFeatureDataSource,
  YMapLayer,
  YMapControls,
  YMapControlButton,
} = reactify.module(ymaps3Global);

// Контролы Яндекс Карт грузим через ymaps3.import(...), а не через обычный
// import('@yandex/ymaps3-default-ui-theme').
// Обычный Vite-import может привести к:
// "Class extends value undefined is not a constructor or null".
const controlsModule = await withTimeout(
  ymaps3Global.import('@yandex/ymaps3-default-ui-theme'),
  15_000,
  runtimeMessage(
    'Не удалось загрузить контролы Яндекс Карт. Возможная причина: VPN, блокировка yastatic.net или cdn.jsdelivr.net.',
    'Yandex Maps controls could not be loaded. A VPN or blocked yastatic.net or cdn.jsdelivr.net may be the cause.',
  ),
);

export const { YMapZoomControl, YMapGeolocationControl, YMapRotateTiltControl } = reactify.module(
  controlsModule as object,
);

export const useDefault = reactify.useDefault;

// Quick-fix 2026-05-16 (п.4): поиск адресов через ВСТРОЕННЫЙ в JS-API
// `ymaps3.search` вместо прямых HTTP-вызовов suggest-maps/geocode-maps.
// Те HTTP-API — отдельные платные продукты Yandex; прод-ключ подключён только
// к JS Maps API, поэтому HTTP-запросы возвращали 403/пусто → «поиск ничего не
// находит». `ymaps3.search` авторизуется ТЕМ ЖЕ ключом из CDN-скрипта
// (api-maps.yandex.ru/v3/?apikey=…), которым уже грузится карта, и отдаёт
// подпись + координаты сразу (отдельный geocode не нужен).
//
// Anti-Pattern #5 соблюдён: единственное место, трогающее глобальный ymaps3.
// ymaps3.ready уже ожидался top-level await выше — на момент вызова API готов.
export interface GeoSearchHit {
  /** Короткое имя объекта (улица/POI). */
  title: string;
  /** Полный адрес/описание (регион). */
  subtitle: string;
  /** [lat, lon] — конвенция parseAsCoords / URL ?from,?dest. */
  coords: [number, number];
}

type Ymaps3SearchFeature = {
  geometry?: { coordinates?: [number, number] }; // [lon, lat]
  properties?: { name?: string; description?: string };
};

// `bounds` — viewport bias для ymaps3.search: при наличии Yandex ранжирует
// результаты внутри bbox выше, и в подсказках первыми идут улицы/POI рядом.
// Формат: [[swLon, swLat], [neLon, neLat]] — совпадает с location.bounds JS-API.
type Ymaps3SearchRequest = {
  text: string;
  bounds?: [[number, number], [number, number]];
};

type Ymaps3WithSearch = {
  search(req: Ymaps3SearchRequest): Promise<Ymaps3SearchFeature[]>;
};

/**
 * Поиск адресов через ymaps3.search (JS-API).
 *
 * @param text — пользовательский ввод.
 * @param bounds — viewport bias (опц.). Когда передан — улицы/POI внутри bbox
 *   ранжируются выше → подсказки в первую очередь показывают объекты рядом
 *   с тем, что юзер видит на карте сейчас (Fix 2026-05-26).
 */
export async function searchGeo(
  text: string,
  bounds?: [[number, number], [number, number]],
): Promise<GeoSearchHit[]> {
  const q = text.trim();
  if (!q) return [];

  const api = ymaps3Global as unknown as Ymaps3WithSearch;

  const req: Ymaps3SearchRequest = { text: q };
  if (bounds) req.bounds = bounds;

  const features = await api.search(req);

  const hits: GeoSearchHit[] = [];

  for (const f of features ?? []) {
    const c = f.geometry?.coordinates;
    if (!c || c.length !== 2) continue;

    const [lon, lat] = c;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    hits.push({
      title: f.properties?.name?.trim() || q,
      subtitle: f.properties?.description?.trim() || '',
      coords: [lat, lon],
    });
  }

  return hits;
}
