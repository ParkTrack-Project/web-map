// CARD-07 / D-07 mobile: shared контекст с ref'ом на YMap-инстанс.
// Consumer (MobileZoneCard) дожидается mapRef.current и вызывает setLocation.
// Если mapRef ещё null (карта монтируется) — consumer тихо пропускает.
//
// Вынесено в отдельный файл из-за react-refresh/only-export-components rule
// (нельзя экспортировать non-component вместе с компонентом из одного файла).
//
// FSD-исключение: widgets/zone-card импортит этот контекст из widgets/map-canvas
// через barrel — допустимый layer-bridge для shared map-instance access.
// Альтернатива через shared/lib (ServiceLocator pattern) — Phase 5 polish.
import { createContext, type RefObject } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';

export const MapRefContext = createContext<RefObject<YMapInstance | null> | null>(null);
