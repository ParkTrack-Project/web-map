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
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

interface Group {
  sumLon: number;
  sumLat: number;
  count: number;
  free: number;
  ids: number[];
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

/**
 * Кластеризует зоны, сливая всё, что на текущем зуме ближе `mergePx` экранных
 * пикселей. Результат стабилен относительно порядка `zones` (union по индексам,
 * центр — среднее центроидов). Зоны-одиночки не образуют кластер — их id в
 * `singletonIds`, чтобы полигон/бейдж-слои рисовали их как обычно.
 */
export function clusterZones(
  zones: ZoneMapItem[],
  zoom: number,
  mergePx: number,
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

  const groups = new Map<number, Group>();
  pts.forEach((p, i) => {
    const root = find(pts, i);
    const g: Group = groups.get(root) ?? {
      sumLon: 0,
      sumLat: 0,
      count: 0,
      free: 0,
      ids: [],
    };
    g.sumLon += p.lon;
    g.sumLat += p.lat;
    g.count += 1;
    g.free += p.zone.is_active ? p.zone.free_count : 0;
    g.ids.push(p.zone.zone_id);
    groups.set(root, g);
  });

  const clusters: ZoneCluster[] = [];
  const singletonIds = new Set<number>();
  for (const [root, g] of groups) {
    if (g.count === 1) {
      singletonIds.add(g.ids[0]!);
      continue;
    }
    clusters.push({
      key: `c${root}-${g.ids.length}`,
      center: [g.sumLon / g.count, g.sumLat / g.count] as [number, number],
      freeSum: g.free,
      zoneCount: g.count,
      zoneIds: g.ids,
    });
  }
  return { clusters, singletonIds };
}
