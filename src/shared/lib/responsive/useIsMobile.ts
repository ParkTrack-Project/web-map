// Detect viewport <1024px (мобильный режим). Используется чтобы НЕ монтировать
// vaul Drawer.Root на desktop — иначе vaul через Portal на body level применяет
// `pointer-events: none` + `aria-hidden=true` к остальному DOM (включая desktop layout)
// и блокирует ВСЁ взаимодействие, даже если CSS `lg:hidden` скрывает Drawer.Content.
//
// Single source of truth для desktop/mobile разделения. Хранится в lib/responsive
// чтобы любая feature/widget могла reuse без кросс-feature import'ов.
import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 1023px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
