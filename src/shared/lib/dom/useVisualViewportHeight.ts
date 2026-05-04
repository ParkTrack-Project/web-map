// Phase 5 D-03 (RESP-05): keyboard-aware viewport height для mobile.
// iOS Safari НЕ обновляет 100dvh при появлении on-screen keyboard
// (Pitfall 1 RESEARCH §1) — только visualViewport API даёт честную динамическую
// высоту. Хук возвращает текущую vv.height в px и устанавливает
// CSS-переменную --keyboard-aware-height на :root, чтобы CSS-only потребители
// могли использовать `max-height: calc(var(--keyboard-aware-height, 100dvh) - 80px)`
// без JS-prop drilling.
//
// Side-effect-only по умолчанию (return value игнорируется потребителями).
// SSR-safe: возвращает 0 при typeof window === 'undefined'.
import { useEffect, useState } from 'react';

export function useVisualViewportHeight(): number {
  const [height, setHeight] = useState<number>(() =>
    typeof window === 'undefined' ? 0 : (window.visualViewport?.height ?? window.innerHeight),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    if (!vv) {
      // Safari < 13 / IE: fallback на window.resize (less accurate, но workable)
      const onResize = () => {
        setHeight(window.innerHeight);
        document.documentElement.style.setProperty(
          '--keyboard-aware-height',
          `${window.innerHeight}px`,
        );
      };
      window.addEventListener('resize', onResize);
      onResize();
      return () => window.removeEventListener('resize', onResize);
    }

    const update = () => {
      setHeight(vv.height);
      document.documentElement.style.setProperty('--keyboard-aware-height', `${vv.height}px`);
    };
    vv.addEventListener('resize', update);
    // iOS scroll event тоже triggers visual viewport change
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
