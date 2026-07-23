// Quick-fix 2026-05-17: непрерывная (scale-adaptive) кластеризация зон.
//
// Раньше было ДВА жёстких режима через CLUSTER_ZOOM_THRESHOLD=14: zoom<14 —
// всё схлопнуто в grid-кружки, zoom>=14 — НИ одной кластеризации (каждая зона
// своим бейджем, даже если бейджи налезают друг на друга — см. скрин с 4
// парковками впритык). Пользователь просил: степень группировки должна
// подбираться под масштаб, на любом зуме показываем максимум РАЗЛИЧИМЫХ точек,
// а при отдалении точки СЛИВАЮТСЯ ПОСТЕПЕННО, по одной.
//
// Решение: на каждом зуме проецируем центроиды в world-пиксели (Web Mercator,
// slippy-схема — та же, что у Яндекс-вектора без наклона) и single-link
// кластеризуем всё, что ближе CLUSTER_MERGE_PX пикселей. Порог в ПИКСЕЛЯХ →
// при отдалении один и тот же гео-зазор даёт меньше px → группы растут;
// при приближении px-зазор растёт → кластеры распадаются по одной зоне.
// Никакого бинарного порога зума: переход непрерывный.
//
// zoneCount===1 → зона рисуется как обычно (полигон + бейдж, точно).
// zoneCount>1   → агрегированный кружок (сумма свободных, число парковок),
//                 а её зоны-участники из полигон/бейдж-слоёв исключаются.
//
// n≈200 зон → grid-hash (ячейка = радиус слияния) + проверка 9 соседних
// ячеек — O(n) на практике, чинит «соседние точки по разные стороны линии
// сетки не слились» (баг старой grid-only схемы и причина 4 несведённых
// парковок на скрине).
import type { ZoneMapItem } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';

type ZoneWithGeometry = Pick<ZoneMapItem, 'zone_id' | 'geometry'>;

export interface ZoneCluster {
  key: string;
  center: [number, number]; // [lon, lat] — порядок ymaps3
  freeSum: number;
  zoneCount: number;
  zoneIds: number[];
}

export interface ClusterResult {
  clusters: ZoneCluster[]; // zoneCount > 1 — рисуются кружком
  singletonIds: Set<number>; // зоны-одиночки — рисуются полигоном + бейджем
}

// Web Mercator world-pixel при данном зуме (slippy / Google scheme).
// scale = 256 * 2^zoom; дистанции в этом пространстве ≈ экранные пиксели
// (карта без наклона/поворота). Непрерывна по дробному зуму.
function projectWorldPx(lon: number, lat: number, zoom: number): [number, number] {
  const scale = 256 * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

// Диаметр кружка кластера в CSS-px (== экранные px на нашем зуме).
// ЕДИНЫЙ источник истины: ZoneClusterLayer рендерит кружок ровно этого
// размера, а пост-проход слияния перекрытий считает по нему же радиус.
export function clusterBubbleSizePx(zoneCount: number): number {
  return Math.min(28 + Math.floor(zoneCount / 4) * 4, 44);
}

// Радиус занимаемого кружком места: половина диаметра + 2px кольцо (ring-2).
// Два кружка перекрываются ⇔ dist(центров) < rA + rB.
const CLUSTER_RING_PX = 2;
function clusterBubbleRadiusPx(zoneCount: number): number {
  return clusterBubbleSizePx(zoneCount) / 2 + CLUSTER_RING_PX;
}

interface Pt {
  zone: ZoneMapItem;
  lon: number;
  lat: number;
  px: number;
  py: number;
  root: number; // union-find
}

function find(pts: Pt[], i: number): number {
  let r = i;
  while (pts[r]!.root !== r) r = pts[r]!.root;
  // path-compression
  let c = i;
  while (pts[c]!.root !== r) {
    const next = pts[c]!.root;
    pts[c]!.root = r;
    c = next;
  }
  return r;
}

// Свободных мест в зоне (неактивная зона мест не даёт).
function freeOf(p: Pt): number {
  return p.zone.is_active ? p.zone.free_count : 0;
}

function sumFree(idx: number[], pts: Pt[]): number {
  let s = 0;
  for (const i of idx) s += freeOf(pts[i]!);
  return s;
}

// Медианный k-d сплит: бьём список точек на под-кластеры, у каждого
// СУММА СВОБОДНЫХ МЕСТ ≤ cap, рекурсивно деля по более длинной оси по
// медиане (пространственно-связно). Одиночную точку дробить нельзя —
// если её free_count сам > cap, она остаётся узлом как есть.
function splitByCap(idx: number[], pts: Pt[], cap: number): number[][] {
  if (idx.length <= 1 || sumFree(idx, pts) <= cap) return [idx];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const i of idx) {
    const p = pts[i]!;
    if (p.px < minX) minX = p.px;
    if (p.px > maxX) maxX = p.px;
    if (p.py < minY) minY = p.py;
    if (p.py > maxY) maxY = p.py;
  }
  const byX = maxX - minX >= maxY - minY;
  const sorted = [...idx].sort((a, b) => (byX ? pts[a]!.px - pts[b]!.px : pts[a]!.py - pts[b]!.py));
  const mid = Math.floor(sorted.length / 2);
  return [
    ...splitByCap(sorted.slice(0, mid), pts, cap),
    ...splitByCap(sorted.slice(mid), pts, cap),
  ];
}

// Агрегат кластера с бегущими суммами — для пост-прохода слияния перекрытий.
interface Agg {
  sumLon: number;
  sumLat: number;
  free: number;
  count: number;
  ids: number[];
  key: string;
}

// Пост-проход: если НАРИСОВАННЫЕ кружки физически перекрываются
// (dist(центров) < rA + rB на текущем зуме), сливаем их в один. Радиус
// зависит от count → после слияния растёт → может зацепить соседей: гоняем
// до фикспоинта. Перекрытые кружки всё равно неразличимы, поэтому слияние
// имеет приоритет над потолком свободных мест (iter.4) — сумма свободных в
// слитой ноде может превысить cap, это норм (визуальная корректность важнее).
// Одна попытка слить первую же перекрывающуюся пару. true — слили (надо
// повторить, т.к. радиус вырос и мог зацепить соседей).
function mergeOnce(aggs: Agg[], zoom: number): boolean {
  for (let i = 0; i < aggs.length; i++) {
    const a = aggs[i]!;
    const [ax, ay] = projectWorldPx(a.sumLon / a.count, a.sumLat / a.count, zoom);
    const ra = clusterBubbleRadiusPx(a.count);
    for (let j = i + 1; j < aggs.length; j++) {
      const b = aggs[j]!;
      const [bx, by] = projectWorldPx(b.sumLon / b.count, b.sumLat / b.count, zoom);
      const rsum = ra + clusterBubbleRadiusPx(b.count);
      const dx = ax - bx;
      const dy = ay - by;
      if (dx * dx + dy * dy < rsum * rsum) {
        a.sumLon += b.sumLon;
        a.sumLat += b.sumLat;
        a.free += b.free;
        a.count += b.count;
        a.ids.push(...b.ids);
        aggs.splice(j, 1); // b ⟶ a
        return true;
      }
    }
  }
  return false;
}

function mergeOverlapping(aggs: Agg[], zoom: number): Agg[] {
  // ≤ N-1 слияний (каждое убирает один agg) → гарантированно сходится.
  while (mergeOnce(aggs, zoom));
  return aggs;
}

/**
 * Кластеризует зоны, сливая всё, что на текущем зуме ближе `mergePx` экранных
 * пикселей. Крупная связная группа дробится на под-кластеры, у каждого СУММА
 * СВОБОДНЫХ МЕСТ ≤ `maxFreeSpots` (потолок свободных мест в одной ноде;
 * Infinity = без потолка). Финальный проход сливает ноды, чьи кружки
 * перекрываются на экране (приоритетнее потолка). Результат стабилен
 * относительно порядка `zones`. Зоны-одиночки не образуют кластер — их id в
 * `singletonIds`, чтобы полигон/бейдж-слои рисовали их как обычно.
 */
export function clusterZones(
  zones: ZoneMapItem[],
  zoom: number,
  mergePx: number,
  maxFreeSpots: number,
): ClusterResult {
  const pts: Pt[] = zones.map((zone, i) => {
    const [lon, lat] = zoneCentroid(zone.geometry);
    const [px, py] = projectWorldPx(lon, lat, zoom);
    return { zone, lon, lat, px, py, root: i };
  });

  // Grid-hash: ячейка = радиус слияния. Кандидаты на union — только точки из
  // своей и 8 соседних ячеек (любая пара ближе mergePx гарантированно туда
  // попадает). Чинит boundary-артефакт чистой grid-схемы.
  const cell = Math.max(mergePx, 1);
  const grid = new Map<string, number[]>();
  const cellKey = (cx: number, cy: number) => `${cx}:${cy}`;
  pts.forEach((p, i) => {
    const cx = Math.floor(p.px / cell);
    const cy = Math.floor(p.py / cell);
    const k = cellKey(cx, cy);
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  });

  const r2 = mergePx * mergePx;
  pts.forEach((p, i) => {
    const cx = Math.floor(p.px / cell);
    const cy = Math.floor(p.py / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(cellKey(cx + dx, cy + dy));
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const q = pts[j]!;
          const ddx = p.px - q.px;
          const ddy = p.py - q.py;
          if (ddx * ddx + ddy * ddy <= r2) {
            pts[find(pts, j)]!.root = find(pts, i);
          }
        }
      }
    }
  });

  // root → индексы точек связной (по пикс. близости) группы.
  const groups = new Map<number, number[]>();
  pts.forEach((_, i) => {
    const root = find(pts, i);
    const arr = groups.get(root);
    if (arr) arr.push(i);
    else groups.set(root, [i]);
  });

  const aggs: Agg[] = [];
  const singletonIds = new Set<number>();
  for (const [root, members] of groups) {
    // Дробим на под-кластеры с суммой свободных мест ≤ потолок (splitByCap
    // сам бейлит, если уже ≤ cap либо одиночная точка / cap = Infinity).
    const chunks = splitByCap(members, pts, maxFreeSpots);
    chunks.forEach((chunk, ci) => {
      if (chunk.length === 1) {
        singletonIds.add(pts[chunk[0]!]!.zone.zone_id);
        return;
      }
      let sumLon = 0;
      let sumLat = 0;
      let free = 0;
      const ids: number[] = [];
      for (const i of chunk) {
        const p = pts[i]!;
        sumLon += p.lon;
        sumLat += p.lat;
        free += freeOf(p);
        ids.push(p.zone.zone_id);
      }
      aggs.push({ sumLon, sumLat, free, count: chunk.length, ids, key: `c${root}-${ci}` });
    });
  }

  // Финальный проход: сливаем ноды, чьи кружки перекрываются на экране.
  const clusters: ZoneCluster[] = mergeOverlapping(aggs, zoom).map((a) => ({
    key: `${a.key}-${a.count}`,
    center: [a.sumLon / a.count, a.sumLat / a.count] as [number, number],
    freeSum: a.free,
    zoneCount: a.count,
    zoneIds: a.ids,
  }));
  return { clusters, singletonIds };
}

/**
 * Минимальный зум, на котором зона с центроидом `target` ПЕРЕСТАЁТ сливаться в
 * агрегированный кружок-кластер: на нём расстояние в экранных пикселях до
 * БЛИЖАЙШЕГО соседнего центроида превышает `mergePx`, поэтому single-link
 * кластеризация (см. clusterZones) оставляет зону одиночкой — она рисуется
 * полигоном + бейджем, а не прячется под кружком группы. Используется при
 * выборе парковки (в списке / кликом по карте), чтобы приблизить ровно
 * настолько, чтобы выбранную зону было видно.
 *
 * `excludeZoneId` — id самой зоны: её центроид совпадает с `target`, иначе она
 * стала бы своим же «ближайшим соседом» на нулевом расстоянии. Соседей нет →
 * `null` (поднимать зум не требуется). Совпадающий центроид у ДРУГОЙ зоны →
 * +Infinity (развести нельзя) — вызывающая сторона клампит по zoomRange.max.
 *
 * Пиксель-расстояние линейно по scale = 256·2^zoom, значит растёт ∝ 2^zoom:
 * d(zoom) = d0·2^zoom, где d0 — расстояние при zoom 0. Разводим, когда
 * d0·2^zoom > mergePx ⇒ zoom > log2(mergePx / d0). Берём максимум по соседям —
 * его задаёт ближайший (у него наибольший требуемый зум).
 */
export function minZoomToDecluster(
  target: [number, number],
  zones: readonly ZoneWithGeometry[],
  mergePx: number,
  excludeZoneId: number,
): number | null {
  const [tx, ty] = projectWorldPx(target[0], target[1], 0);
  let need = -Infinity;
  for (const z of zones) {
    if (z.zone_id === excludeZoneId) continue;
    if (!z.geometry?.coordinates?.[0]?.length) continue;
    const [lon, lat] = zoneCentroid(z.geometry);
    const [nx, ny] = projectWorldPx(lon, lat, 0);
    const d0 = Math.hypot(tx - nx, ty - ny);
    const req = d0 > 0 ? Math.log2(mergePx / d0) : Infinity;
    if (req > need) need = req;
  }
  return need === -Infinity ? null : need;
}
