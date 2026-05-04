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

## Phase 5 D-17 verification protocol

Before flipping `VITE_API_MODE=real` for production:

1. Run `npm run test:e2e:real-api` (Plan 05-03) — the «Filters: GET /zones with all 7 filter params» test asserts the combined-params GET returns 200.
2. If combined GET returns 400/422 → real API does NOT support one of the 7 server params. Identify the offending param via individual smoke (one filter at a time):

   ```bash
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&min_free_count=1"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&min_confidence=0.5"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&max_pay=200"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&include_private=false"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&include_accessible=false"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&hide_location_types=open_lot,underground"
   curl "$VITE_API_BASE_URL/zones?bbox=$BBOX&view=map&is_active=true"
   ```

3. Update the verification status table below with the result for each param.
4. For any param marked `rejected`: edit `web-map/src/features/filter-zones/lib/buildServerQuery.ts` to NOT emit that param to server; corresponding client predicate in `applyClientFilters.ts` becomes the sole gate.
5. Append the smoke artefact to `phase-05-uat/real-api-smoke.log` (see structure below).

### Verification status (filled by Plan 05-05 UAT)

| UI filter      | Server param         | Real-API smoke status | Action if unsupported                  |
| -------------- | -------------------- | --------------------- | -------------------------------------- |
| hideNoFree     | `min_free_count`     | unverified            | Drop from buildServerQuery             |
| minConf        | `min_confidence`     | unverified            | Already client-side too (safety-net)   |
| maxPay         | `max_pay`            | unverified            | Already client-side too (safety-net)   |
| hidePrivate    | `include_private`    | unverified            | Drop from buildServerQuery             |
| hideAccessible | `include_accessible` | unverified            | Drop from buildServerQuery             |
| locationType   | `hide_location_types`| unverified            | Drop, locationType remains client-only |
| hideInactive   | `is_active`          | unverified            | Drop from buildServerQuery             |

Status legend:

- `unverified` — not yet smoke-tested against real API (initial state at Plan 05-03 close)
- `accepted` — real API returns 200 with this param and visibly filters response
- `degraded` — real API accepts but ignores; client predicate still works as safety-net
- `rejected` — real API returns 4xx; param removed from buildServerQuery, client-only fallback engages
- `client-only-fallback` — explicit choice to keep predicate client-side regardless of server support (e.g. when reliable filtering is required even on partial backend coverage)

### Phase 5 D-18 normalizer conditional

If real-API `/zones` response shape differs from our `web-map/src/entities/zone/model/zone.types.ts` `Zone` interface (e.g. missing field, renamed key, different enum values), Plan 05-05 should create `web-map/src/entities/zone/api/normalizers.ts` exporting `normalizeZone(raw): Zone`. ALL raw→domain mapping happens there — no scattered casts in widgets/features. If shapes match → no normalizer needed (D-18: minimize dead code).

Smoke artifacts log: `phase-05-uat/real-api-smoke.log` should record:

- Endpoint URL (with query string)
- HTTP status code
- First 200 chars of response body
- Shape diff vs our `Zone` / `RouteCandidate` / `Route` interface (if applicable)
- Date and `git rev-parse --short HEAD` of web-map at smoke time

Cross-link: Plan 05-03 only sets up the protocol; Plan 05-05 UAT actually runs `npm run test:e2e:real-api` against the live `api.parktrack.live` and fills in the table above.
