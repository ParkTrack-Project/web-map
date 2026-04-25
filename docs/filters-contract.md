# Filters Contract — Phase 2 baseline

Маппинг 7 UI-фильтров (`features/filter-zones`) на API query params (`/zones?...`)
и client-side predicate'ы (`applyClientFilters`).

Источник истины — `web-map/src/features/filter-zones/lib/buildServerQuery.ts`
(server-side mapping) и `applyClientFilters.ts` (client-side fallback / safety-net).

## Маппинг

| UI filter                          | Default  | URL param           | API param (server-side)                                           | Client predicate (always-on safety) | Если API вернёт 4xx                                                          |
| ---------------------------------- | -------- | ------------------- | ----------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| hideNoFree (Только свободные)      | false    | `?fNoFree=true`     | `min_free_count=1`                                                | —                                   | Falls back to client filter `z.free_count >= 1` + console.warn               |
| minConf (Уверенность ≥ X%)         | 0        | `?fMinConf=0.5`     | `min_confidence=0.5`                                              | `z.confidence >= minConf`           | Server param опционален; client predicate всегда работает                    |
| maxPay (Цена ≤ N ₽)                | null (∞) | `?fMaxPay=200`      | `max_pay=200`                                                     | `z.pay <= maxPay`                   | Server param опционален; client predicate всегда работает                    |
| hidePrivate (Без частных)          | false    | `?fNoPriv=true`     | `include_private=false`                                           | —                                   | Falls back to client `!z.is_private` + console.warn                          |
| hideAccessible (Без для инвалидов) | false    | `?fNoAcc=true`      | `include_accessible=false`                                        | —                                   | Falls back to client `!z.is_accessible` + console.warn                       |
| locationType (тип расположения)    | [] (все) | `?fLoc=street,yard` | `hide_location_types=open_lot,underground,multilevel` (инверсия!) | —                                   | Falls back to client `locationType.includes(z.location_type)` + console.warn |
| hideInactive (Скрыть неактивные)   | true     | `?fInactive=false`  | `is_active=true`                                                  | —                                   | Falls back to client `z.is_active` + console.warn                            |

## Принцип инверсии для locationType

UI хранит **видимые** типы (например `['street', 'yard']`); сервер ожидает **скрытые** (`open_lot,underground,multilevel`). Это сделано для того, чтобы:

- При пустом `locationType` (default) — никаких параметров не отправляется → API возвращает все типы
- Чтобы свежий пользователь видел всё, не отмечая 5 чек-боксов

## sessionStorage namespace

Все фильтры хранятся в `parktrack:f:v1:` префиксе. Bump-нуть до `v2` при breaking-change схемы фильтров (Phase 3+).

Точные ключи: `hideNoFree`, `minConf`, `maxPay`, `hidePrivate`, `hideAccessible`, `locationType`, `hideInactive`.

## URL hydration policy

- URL имеет **приоритет** над sessionStorage
- При свежем запуске (URL пуст для конкретного `f*` параметра) → читаем SS → пишем в URL через nuqs `history: 'replace'`
- При каждом изменении фильтра → одновременно nuqs URL (replaceState) + sessionStorage write
- Дефолтные значения **не сериализуются** в URL (nuqs `clearOnDefault: true`) → URL чистый. Toggle ON-then-OFF удаляет параметр (D-15).

## Phase 5 интеграция (Никита, real API)

Перед свитчем `VITE_API_BASE_URL=https://api.parktrack.live`:

1. Прогнать каждый из 7 фильтров вручную → проверить, что response-size меняется
2. Если для какого-то параметра API вернёт 400/422 — пометить «client-only» в этой таблице, удалить из buildServerQuery, оставить в applyClientFilters
3. Если появятся новые server params (`min_free_count_relative` и т.п.) — обновить таблицу и buildServerQuery
