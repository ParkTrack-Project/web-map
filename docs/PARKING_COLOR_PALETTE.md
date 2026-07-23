# Цветовая палитра парковок ParkTrack

Формат `#RRGGBBAA` означает HEX-цвет с прозрачностью.

Источник палитры: `src/shared/config/zone-palette.ts`.

## Светлая тема

| Состояние парковки              | Условие                               |     Заливка |   Обводка |
| ------------------------------- | ------------------------------------- | ----------: | --------: |
| Неактивная                      | `is_active = false`                   | `#9CA3AF8C` | `#4B5563` |
| Полностью занята                | `free_count = 0`                      | `#D8161696` | `#CD2B2B` |
| Одно свободное место            | `free_count = 1`                      | `#F5AB0B96` | `#B48409` |
| Есть места, низкая уверенность  | `free_count ≥ 2`, `confidence < 0.75` | `#86EFAC96` | `#2D8714` |
| Есть места, высокая уверенность | `free_count ≥ 2`, `confidence ≥ 0.75` | `#16A34AAA` | `#155E2A` |

## Тёмная тема

| Состояние парковки              | Условие                               |     Заливка |   Обводка |
| ------------------------------- | ------------------------------------- | ----------: | --------: |
| Неактивная                      | `is_active = false`                   | `#E4E4E7D9` | `#D4D4D8` |
| Полностью занята                | `free_count = 0`                      | `#FF5252E6` | `#FF5252` |
| Одно свободное место            | `free_count = 1`                      | `#FFC107EB` | `#FFC107` |
| Есть места, низкая уверенность  | `free_count ≥ 2`, `confidence < 0.75` | `#4ADE80E0` | `#4ADE80` |
| Есть места, высокая уверенность | `free_count ≥ 2`, `confidence ≥ 0.75` | `#00E676EB` | `#00E676` |

## Кластеры парковок

Кружки кластеров используют непрозрачный цвет обводки соответствующей темы.

| Свободных мест в кластере | Светлая тема | Тёмная тема |
| ------------------------- | -----------: | ----------: |
| `0`                       |    `#CD2B2B` |   `#FF5252` |
| `1–2`                     |    `#B48409` |   `#FFC107` |
| `3 и больше`              |    `#155E2A` |   `#00E676` |

## Выбранная парковка

Выбранная парковка сохраняет свой семантический цвет, но получает более толстую обводку:

- обычный полигон — `1px`;
- выбранный полигон — `3px`;
- обычная параллельная парковка — `6px`;
- выбранная параллельная парковка — `8px`.

В палитре также определены отдельные selected-токены, которые сейчас фактически не применяются:

| Тема    |   Обводка |    Свечение |
| ------- | --------: | ----------: |
| Светлая | `#16A34A` | `#16A34A4D` |
| Тёмная  | `#B9F6CA` | `#00E67699` |

## Приглушённые парковки

Парковки вне результатов поиска или не выбранные при открытой карточке сохраняют исходный RGB, но получают:

- заливку с прозрачностью `18%` — альфа `#2E`;
- обводку с прозрачностью `36%` — альфа `#5C`.

Например, насыщенная зелёная парковка:

- светлая тема: заливка `#16A34A2E`, обводка `#155E2A5C`;
- тёмная тема: заливка `#00E6762E`, обводка `#00E6765C`.

## Порядок выбора цвета

Правила применяются в следующем порядке:

1. Если парковка неактивна, используется серая палитра.
2. Если свободных мест нет, используется красная палитра.
3. Если свободно одно место, используется янтарная палитра.
4. Если свободно два места или больше и `confidence ≥ 0.75`, используется насыщенная зелёная палитра.
5. В остальных случаях используется светло-зелёная палитра низкой уверенности.

---

## Полная спецификация отрисовки на Yandex Maps

Ниже описаны геометрия, стили, слои и алгоритм кластеризации. Этой информации достаточно, чтобы воспроизвести текущее отображение парковок.

### Входные данные парковки

Для отрисовки используются поля:

```ts
interface ParkingZone {
  zone_id: number;
  zone_type: 'standard' | 'parallel';
  geometry: {
    type: 'Polygon';
    // GeoJSON: [longitude, latitude], внешний замкнутый контур.
    coordinates: number[][][];
  };
  free_count: number;
  confidence: number;
  is_active: boolean;
}
```

Координаты в Yandex Maps передаются в порядке `[longitude, latitude]`.

### Общая функция выбора стиля

```ts
const CONFIDENCE_THRESHOLD = 0.75;

function selectParkingColors(zone: ParkingZone, theme: 'light' | 'dark') {
  const palette = theme === 'dark' ? darkPalette : lightPalette;

  if (!zone.is_active) return palette.inactive;
  if (zone.free_count === 0) return palette.full;
  if (zone.free_count === 1) return palette.one;
  if (zone.confidence >= CONFIDENCE_THRESHOLD) return palette.freeHigh;
  return palette.freeLow;
}
```

Проверки выполняются строго в указанном порядке. Например, неактивная парковка всегда серая независимо от `free_count`.

### Когда парковка приглушается

```ts
function shouldDimZone(
  zoneId: number,
  selectedZoneId: number | null,
  resultZoneIds: readonly number[],
) {
  if (selectedZoneId !== null) return zoneId !== selectedZoneId;
  return resultZoneIds.length > 0 && !resultZoneIds.includes(zoneId);
}
```

- если открыта конкретная парковка, приглушаются все остальные;
- если открыт список результатов, приглушаются парковки вне результатов;
- в остальных случаях парковки отображаются с полной яркостью.

Для полигонов и линий приглушение заменяет исходную альфу:

```ts
const polygonFillOpacity = dimmed ? 0.18 : originalFillOpacity;
const polygonStrokeOpacity = dimmed ? 0.36 : 1;
```

Для HTML-счётчиков парковок и кластеров:

```css
opacity: 0.38; /* приглушённый */
opacity: 1; /* обычный */
```

## Полигоны обычных парковок

Парковки с `zone_type = "standard"` рисуются как `YMapFeature` с исходным GeoJSON-полигоном.

Все полигоны остаются видимыми даже тогда, когда их центроиды входят в кластер. Кружок кластера располагается поверх них.

### Yandex Maps API

```ts
const style = {
  fill: selectedColors.fill,
  stroke: [
    {
      color: selectedColors.stroke,
      width: selected ? 3 : 1,
    },
  ],
};

const feature = new YMapFeature({
  id: `zone-${zone.zone_id}`,
  source: 'ptk-zones-standard',
  geometry: {
    type: 'Polygon',
    coordinates: zone.geometry.coordinates,
  },
  style,
});
```

### Слой

```ts
new YMapFeatureDataSource({ id: 'ptk-zones-standard' });
new YMapLayer({
  source: 'ptk-zones-standard',
  type: 'features',
  zIndex: 1900,
});
```

### Толщина

| Состояние          | Толщина обводки |
| ------------------ | --------------: |
| Обычная парковка   |           `1px` |
| Выбранная парковка |           `3px` |

Выбор парковки не меняет её цвет — меняется только толщина обводки.

## Линии параллельных парковок

Парковки с `zone_type = "parallel"` преобразуются из полигона в центральную линию.

### Построение LineString

1. Берутся первые четыре вершины замкнутого четырёхугольника.
2. Вычисляются длины четырёх сторон.
3. Выбираются две самые короткие стороны.
4. Находится середина каждой выбранной стороны.
5. Между этими серединами строится `LineString`.

```ts
function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

const lineGeometry = {
  type: 'LineString',
  coordinates: [midpoint(shortEdge1), midpoint(shortEdge2)],
};
```

Если внешний контур содержит меньше пяти точек, включая замыкающую, линия не рисуется.

### Yandex Maps API

Линия использует только цвет `stroke` выбранной семантической палитры. Заливка не используется.

```ts
const style = {
  stroke: [
    {
      color: selectedColors.stroke,
      width: selected ? 8 : 6,
    },
  ],
};
```

### Слой

```ts
new YMapFeatureDataSource({ id: 'ptk-zones-parallel' });
new YMapLayer({
  source: 'ptk-zones-parallel',
  type: 'features',
  zIndex: 1901,
});
```

| Состояние                       | Толщина линии |
| ------------------------------- | ------------: |
| Обычная параллельная парковка   |         `6px` |
| Выбранная параллельная парковка |         `8px` |

## Центр парковки

Счётчики и кластеризация используют среднее арифметическое вершин внешнего контура без последней замыкающей точки:

```ts
function zoneCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0];
  const points = ring.slice(0, -1);

  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
}
```

Это не площадной геометрический центроид, а среднее вершин.

## Счётчик свободных мест отдельной парковки

Счётчик рисуется только при выполнении обоих условий:

1. текущий zoom карты `≥ 14`;
2. парковка является singleton и не входит в кластер на текущем масштабе.

Внутри отображается `free_count`.

Фон счётчика равен непрозрачному `stroke`-цвету парковки из соответствующей темы.

### Слой

```ts
new YMapFeatureDataSource({ id: 'ptk-badges' });
new YMapLayer({
  source: 'ptk-badges',
  type: 'markers',
  zIndex: 2000,
});
```

### Позиционирование YMapMarker

Yandex Maps размещает левый верхний угол HTML-элемента в координате маркера. Для точного центрирования используется нулевой wrapper:

```html
<div class="marker-origin">
  <button class="parking-counter">5</button>
</div>
```

```css
.marker-origin {
  position: relative;
  width: 0;
  height: 0;
}

.parking-counter {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);

  cursor: pointer;
  border: 0;
  border-radius: 9999px;
  padding: 2px 6px;

  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  white-space: nowrap;

  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 10%),
    0 1px 2px -1px rgb(0 0 0 / 10%);
}

html[data-theme='light'] .parking-counter {
  color: #ffffff;
}

html[data-theme='dark'] .parking-counter {
  color: #09090b; /* zinc-950 */
}
```

Цвет `background-color` вычисляется по таблицам палитры:

```ts
parkingCounter.style.backgroundColor = selectParkingColors(zone, theme).stroke;
parkingCounter.style.opacity = dimmed ? '0.38' : '1';
```

У счётчика нет фиксированной ширины или высоты: из-за горизонтального padding он может выглядеть как круг или короткая овальная pill в зависимости от количества цифр.

## Кружки группировки

Кластер отображается только для группы из двух парковок или больше. Внутри указывается сумма свободных мест `freeSum`, а не количество парковок.

Неактивная парковка добавляет в `freeSum` ноль:

```ts
const parkingFree = zone.is_active ? zone.free_count : 0;
```

### Цвет кластера

```ts
function clusterColor(freeSum: number, theme: 'light' | 'dark') {
  const palette = theme === 'dark' ? darkPalette : lightPalette;

  if (freeSum === 0) return palette.full.stroke;
  if (freeSum <= 2) return palette.one.stroke;
  return palette.freeHigh.stroke;
}
```

Кластеры не используют серый `inactive` и светло-зелёный `freeLow`.

### Размер кластера

```ts
const size = Math.min(28 + Math.floor(zoneCount / 4) * 4, 44);
```

| Количество парковок |         Диаметр |
| ------------------- | --------------: |
| `2–3`               |          `28px` |
| `4–7`               |          `32px` |
| `8–11`              |          `36px` |
| `12–15`             |          `40px` |
| `16 и больше`       | максимум `44px` |

Размер шрифта:

```ts
const fontSize = size >= 38 ? 13 : 11;
```

То есть кластеры диаметром `40–44px` используют `13px`, остальные — `11px`.

### Слой

```ts
new YMapFeatureDataSource({ id: 'ptk-clusters' });
new YMapLayer({
  source: 'ptk-clusters',
  type: 'markers',
  zIndex: 2100,
});
```

### CSS кластера

```css
.parking-cluster {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  border: 0;
  border-radius: 9999px;
  font-weight: 600;

  /* Tailwind shadow-md */
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -2px rgb(0 0 0 / 10%),
    0 0 0 2px rgb(255 255 255 / 70%);
}

html[data-theme='light'] .parking-cluster {
  color: #ffffff;
}

html[data-theme='dark'] .parking-cluster {
  color: #09090b; /* zinc-950 */
}
```

Динамические значения:

```ts
cluster.style.width = `${size}px`;
cluster.style.height = `${size}px`;
cluster.style.fontSize = `${size >= 38 ? 13 : 11}px`;
cluster.style.backgroundColor = clusterColor(freeSum, theme);
cluster.style.opacity = dimmed ? '0.38' : '1';
```

Белое кольцо имеет толщину `2px` и цвет `rgba(255, 255, 255, 0.7)`, HEX-эквивалент — `#FFFFFFB3`.

## Алгоритм кластеризации

Кластеризация scale-adaptive: фиксированного zoom, ниже которого все парковки группируются, нет.

Текущий дробный zoom квантуется шагом `0.5`:

```ts
const clusterZoom = Math.round(mapZoom / 0.5) * 0.5;
```

### Проекция в экранные пиксели

Для каждого центроида вычисляются world pixels Web Mercator:

```ts
const scale = 256 * 2 ** zoom;
const x = ((longitude + 180) / 360) * scale;
const sinLatitude = Math.sin((latitude * Math.PI) / 180);
const y = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale;
```

### Первичное объединение

- `CLUSTER_MERGE_PX = 22`;
- две точки объединяются, если расстояние между центроидами `≤ 22px`;
- объединение single-link и транзитивное: если A близка к B, а B близка к C, все три могут попасть в одну группу;
- фактическая реализация использует grid-hash с ячейкой `22px` и проверяет текущую и восемь соседних ячеек.

### Ограничение суммы свободных мест

Крупная связная группа рекурсивно делится медианой по самой длинной экранной оси, пока сумма свободных мест не превысит лимит:

| Zoom   | Максимальный `freeSum` до финального merge |
| ------ | -----------------------------------------: |
| `< 7`  |                                     `1400` |
| `< 10` |                                      `350` |
| `< 13` |                                      `150` |
| `≥ 13` |                            без ограничения |

Одиночную парковку не делят, даже если её `free_count` превышает лимит.

### Центр кластера

Координата кластера — среднее арифметическое центроидов всех парковок группы:

```ts
clusterCenter = [
  sumOfParkingCentroidLongitudes / zoneCount,
  sumOfParkingCentroidLatitudes / zoneCount,
];
```

### Слияние перекрывающихся кружков

После первичной кластеризации кружки, которые физически перекрываются, объединяются до достижения стабильного состояния.

Радиус кружка для проверки:

```ts
const collisionRadius = clusterSize / 2 + 2;
```

Дополнительные `2px` соответствуют белому кольцу.

Два кружка объединяются, когда:

```ts
distanceBetweenCenters < radiusA + radiusB;
```

Этот финальный merge имеет приоритет над ограничением `freeSum`, поэтому после него сумма может превысить лимит таблицы.

## Порядок слоёв карты

| Элемент                      | Data source          | Тип слоя   | `z-index` |
| ---------------------------- | -------------------- | ---------- | --------: |
| Прозрачный слой жестов карты | —                    | feature    |    `1800` |
| Полигоны standard-парковок   | `ptk-zones-standard` | `features` |    `1900` |
| Линии parallel-парковок      | `ptk-zones-parallel` | `features` |    `1901` |
| Счётчики отдельных парковок  | `ptk-badges`         | `markers`  |    `2000` |
| Кружки кластеров             | `ptk-clusters`       | `markers`  |    `2100` |
| Линия маршрута               | —                    | feature    |    `2150` |
| Начало маршрута              | —                    | marker     |    `2200` |
| Конец маршрута               | —                    | marker     |    `2300` |

Собственные marker-слои нужны, чтобы счётчики и кластеры находились выше встроенного слоя парковок Yandex Maps.

## Интерактивность

- Наведение курсора не меняет парковку, карту, список или стили.
- Клик по полигону, линии или счётчику выбирает парковку.
- При выборе парковка центрируется и карта приближается минимум до zoom `16`, но никогда не отдаляется.
- Если парковка входит в кластер, zoom дополнительно увеличивается до уровня её отделения.
- Клик по кластеру центрирует карту на кластере и выбирает ближайший больший zoom, на котором его парковки разделяются минимум на две группы или singleton-зоны.
- Анимация изменения камеры длится `300ms`.

## Минимальная структура HTML-маркеров

```html
<!-- Отдельная парковка -->
<div class="marker-origin">
  <button class="parking-counter" style="background-color: var(--parking-stroke); opacity: 1">
    5
  </button>
</div>

<!-- Кластер -->
<div class="marker-origin">
  <button
    class="parking-cluster"
    style="
      width: 32px;
      height: 32px;
      background-color: var(--cluster-color);
      font-size: 11px;
      opacity: 1;
    "
  >
    12
  </button>
</div>
```
