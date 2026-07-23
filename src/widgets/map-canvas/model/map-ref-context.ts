import { createContext, type RefObject } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';

export const MapRefContext = createContext<RefObject<YMapInstance | null> | null>(null);
