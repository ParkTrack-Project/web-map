// ZONE-06 / D-02: redundant encoding — pill с free_count поверх каждой зоны.
//
// Скрывается при zoom < ZONE_BADGE_MIN_ZOOM (=14), чтобы карта не превратилась
// в шум.
//
// Quick-fix 2026-05-16 (п.3): белый бейдж сливался с подложкой карты. Теперь
// фон бейджа = семантический цвет зоны (solid stroke-цвет из палитры D-01:
// серый/красный/янтарный/зелёный), текст белый → бейдж читается на карте и
// сразу кодирует занятость, как и сам полигон.
//
// Fix 2026-05-16 (6): бейдж КЛИКАБЕЛЕН и сам открывает карточку зоны
// (setSelectedZone — то же действие, что клик по полигону в ZoneLayer).
// Раньше был pointer-events-none в расчёте на «проваливание» клика в полигон
// под ним, но после выноса бейджей в отдельный markers-слой ВЫШЕ полигонов
// (Fix 5) pass-through не срабатывал — по кружку парковка не открывалась.
//
// Quick-fix 2026-05-16: бейдж стоит в ЦЕНТРЕ зоны (zoneCentroid = среднее
// вершин полигона), а не в углу — так цифра «по центру парковки» и читается
// очевиднее. Для маленьких парковочных прямоугольников среднее вершин = их
// геометрический центр; точка географическая → зум-инвариантна.
//
// Fix 2026-05-16 (4): хватит гадать про якорь ymaps3 (top-left vs center).
// Бейдж в обёртке 0×0: у элемента нулевого размера top-left == center, поэтому
// ymaps3 ставит его origin в координату ОДИНАКОВО при любой своей конвенции.
// Сам pill абсолютно позиционируется в этом origin (left/top:0) и центрируется
// translate(-50%,-50%) → центр pill ровно в центроиде полигона при любом
// дефолте ymaps3.
//
// ПРИМ.: cyan-прямоугольник на карте — ВСТРОЕННЫЙ парковочный слой Yandex
// (YMapDefaultFeaturesLayer), другой датасет. Наши zone-полигоны —
// зелёный/янтарный/красный/серый (zone-palette), и бейдж сидит на углу
// ИМЕННО нашего полигона, а не Yandex-овского cyan.
//
// Fix 2026-05-16 (5): бейджи в СВОЁМ markers-слое (source ptk-badges,
// zIndex 2000). Раньше маркеры жили в дефолтном features-слое (низкий zIndex),
// а слой zone-полигонов (ZoneLayer zIndex 1900 / ParallelZoneLayer 1901)
// рисовался ПОВЕРХ — полигон перекрывал цифру. Выделенный слой с zIndex выше
// зон гарантирует, что цифра всегда читается над полигоном. zIndex слоя
// доминирует над per-marker zIndex (тот лишь упорядочивает бейджи между собой).
import { YMapMarker, YMapFeatureDataSource, YMapLayer } from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useSelectedZone } from '@/features/select-zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { ZONE_BADGE_MIN_ZOOM } from '@/shared/config';
import { computeZoneStyle } from '../model/zone-style';
import { useZoneClusters } from '../model/useZoneClusters';

interface Props {
  zoom: number;
}

export function ZoneBadgesLayer({ zoom }: Props) {
  // Phase 2 Plan 03: бейджи показываются только для зон, прошедших фильтры.
  const { data } = useFilteredZones();
  const { setSelectedZone } = useSelectedZone();
  // Quick-fix 2026-05-17: бейдж только у зон-одиночек на текущем зуме — те,
  // что слились в кластер, представляет кружок ZoneClusterLayer (хук зовём
  // до early-return: правило хуков).
  const { singletonIds } = useZoneClusters(zoom);
  if (zoom < ZONE_BADGE_MIN_ZOOM) return null;
  // Quick-fix 2026-05-16 (п.1): НЕ гасим бейджи на транзиентной ошибке/refetch.
  // keepPreviousData держит последние валидные данные — рендерим их, пока есть,
  // чтобы зоны не «пропадали до перезагрузки».
  if (!data) return null;

  const visible = data.filter((z) => singletonIds.has(z.zone_id));

  return (
    <>
      <YMapFeatureDataSource id="ptk-badges" />
      <YMapLayer source="ptk-badges" type="markers" zIndex={2000} />
      {visible.map((z) => {
        const c = zoneCentroid(z.geometry);
        // Семантический цвет = тот же, что у полигона зоны (палитра D-01).
        // Берём solid stroke-цвет (без альфы) — контрастен с белым текстом.
        const { stroke } = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: false,
        });
        return (
          <YMapMarker
            key={`badge-${z.zone_id}`}
            source="ptk-badges"
            coordinates={c}
            zIndex={2000}
          >
            {/* 0×0 anchor — делает центрирование независимым от дефолта ymaps3 */}
            <div style={{ position: 'relative', width: 0, height: 0 }}>
              <button
                type="button"
                data-testid="zone-badge"
                aria-label={`Парковка #${z.zone_id}, свободно ${z.free_count}. Открыть`}
                onClick={() => setSelectedZone(z.zone_id)}
                className="absolute cursor-pointer whitespace-nowrap rounded-full border-0 px-1.5 py-0.5 text-xs font-semibold text-white shadow"
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: stroke,
                }}
              >
                {z.free_count}
              </button>
            </div>
          </YMapMarker>
        );
      })}
    </>
  );
}
