import { z } from 'zod';

const EnvSchema = z.object({
  VITE_YMAP_KEY: z.string().min(1, 'VITE_YMAP_KEY is required'),
  VITE_AUTH_MODE: z.enum(['mock', 'shared']).default('mock'),
  VITE_API_BASE_URL: z.string().url().default('https://api.parktrack.live'),
  // Phase 5 D-09: shared-shell login redirect target.
  // Используется AuthListener'ом для построения URL `${VITE_SHARED_SHELL_URL}/login?return=...`
  // при 401 в shared-mode. На localhost cookie .parktrack.live недоступна (Pitfall 4).
  VITE_SHARED_SHELL_URL: z.string().url().default('https://parktrack.live'),
  // Phase 5 D-15: независимый toggle от VITE_AUTH_MODE.
  // 'mock' (default в DEV/test) → MSW handlers; 'real' → реальный API Никиты.
  // Можно тестировать combo: real-API + mock-auth (для развития до Misha-shell)
  // или mock-API + shared-auth (для тестирования shell handoff).
  VITE_API_MODE: z.enum(['mock', 'real']).default('mock'),
});

export const env = EnvSchema.parse({
  VITE_YMAP_KEY: import.meta.env.VITE_YMAP_KEY,
  VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SHARED_SHELL_URL: import.meta.env.VITE_SHARED_SHELL_URL,
  VITE_API_MODE: import.meta.env.VITE_API_MODE,
});

export { EnvSchema };
