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
