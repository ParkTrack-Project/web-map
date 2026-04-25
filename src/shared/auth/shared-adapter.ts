// Phase 5 stub: реальная интеграция с общим shell Миши.
// Никогда не должен вызываться в Phase 1-4 (env.VITE_AUTH_MODE='mock').
import type { AuthAdapter } from './AuthAdapter';

const sharedAdapter: AuthAdapter = {
  useAuth() {
    throw new Error('Shared AuthAdapter not implemented — Phase 5');
  },
};

export default sharedAdapter;
