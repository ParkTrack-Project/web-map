import { z } from 'zod';

const EnvSchema = z.object({
  VITE_YMAP_KEY: z.string().min(1, 'VITE_YMAP_KEY is required'),
  VITE_API_BASE_URL: z.string().url().default('https://api.parktrack.live'),
  // 'mock' (default в DEV/test) → MSW handlers; 'real' → реальный API.
  VITE_API_MODE: z.enum(['mock', 'real']).default('mock'),
});

export const env = EnvSchema.parse({
  VITE_YMAP_KEY: import.meta.env.VITE_YMAP_KEY,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_MODE: import.meta.env.VITE_API_MODE,
});

export { EnvSchema };
