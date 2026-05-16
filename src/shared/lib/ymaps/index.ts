// THE single load-bearing module touching window.ymaps3 (Anti-Pattern #5: больше нигде в src/
// нельзя ссылаться на window.ymaps3 — всё через этот barrel).
//
// FOUND-03: Yandex Maps API v3 загружается как runtime-only через CDN-script в index.html.
// Никаких npm-зависимостей на ymaps3 — только @yandex/ymaps3-types в devDependencies.
//
// Pitfall #1 (imperative desync): location и другие "controlled" props НЕ применяются повторно.
// Используйте reactify.useDefault для controlled-биндингов или onUpdate-callback для чтения.
// При необходимости управления location снаружи — обновляйте через map ref напрямую,
// иначе React будет переписывать состояние карты.
//
// Если CDN-скрипт упал (network/блокировка/неверный ключ), window.ymaps3 === undefined,
// top-level await ниже бросит TypeError → MapErrorBoundary поймает и покажет fallback (MAP-07).
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// `ymaps3` — глобальный объект, типы которого подключены через
// "types": ["@yandex/ymaps3-types"] в tsconfig.app.json. Поэтому достаточно
// сослаться на него напрямую. window.ymaps3 === ymaps3 в рантайме.
const [ymaps3React] = await Promise.all([ymaps3.import('@yandex/ymaps3-reactify'), ymaps3.ready]);

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
} = reactify.module(ymaps3);

// FIX 2026-04-25: пакет `@yandex/ymaps3-default-ui-theme` (бета-имя) больше не
// признаётся Yandex v3 — bundle CDN явно whitelist'ит только `controls` (с версией).
// YMapZoomControl/YMapGeolocationControl теперь живут в @yandex/ymaps3-controls@0.0.1.
// Cast через unknown — runtime-shape пакета совпадает с типами default-ui-theme.
const controlsModule = (await (
  ymaps3.import as (m: string) => Promise<typeof import('@yandex/ymaps3-default-ui-theme')>
)('@yandex/ymaps3-controls@0.0.1')) as typeof import('@yandex/ymaps3-default-ui-theme');
export const { YMapZoomControl, YMapGeolocationControl } = reactify.module(controlsModule);

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
// ymaps3.ready уже сожидался top-level await выше — на момент вызова API готов.
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
type Ymaps3WithSearch = {
  search(req: { text: string }): Promise<Ymaps3SearchFeature[]>;
};

export async function searchGeo(text: string): Promise<GeoSearchHit[]> {
  const q = text.trim();
  if (!q) return [];
  const api = ymaps3 as unknown as Ymaps3WithSearch;
  const features = await api.search({ text: q });
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
