import { useEffect, type PropsWithChildren } from 'react';
import { useSession } from '../model/session.store';

export function SessionProvider({ children }: PropsWithChildren) {
  const bootstrap = useSession((state) => state.bootstrap);
  const clear = useSession((state) => state.clear);

  useEffect(() => {
    void bootstrap();
    window.addEventListener('parktrack:unauthorized', clear);
    return () => window.removeEventListener('parktrack:unauthorized', clear);
  }, [bootstrap, clear]);

  return children;
}
