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

// Контролы берём из npm-пакета @yandex/ymaps3-default-ui-theme.
// Важно: импортируем пакет динамически ПОСЛЕ ymaps3.ready выше. Если брать
// @yandex/ymaps3-controls@0.0.1, часть экспортов может отсутствовать в рантайме
// (например YMapRotateTiltControl), и React падает с minified error #130
// из-за попытки отрендерить undefined как JSX-компонент.
const controlsModule = await import('@yandex/ymaps3-default-ui-theme');

export const { YMapZoomControl, YMapGeolocationControl, YMapRotateTiltControl } =
  reactify.module(controlsModule);

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
  const api = ymaps3 as unknown as Ymaps3WithSearch;
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
