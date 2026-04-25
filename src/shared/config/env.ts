import { z } from 'zod';

const EnvSchema = z.object({
  VITE_YMAP_KEY: z.string().min(1, 'VITE_YMAP_KEY is required'),
  VITE_AUTH_MODE: z.enum(['mock', 'shared']).default('mock'),
  VITE_API_BASE_URL: z.string().url().default('https://api.parktrack.live'),
});

export const env = EnvSchema.parse({
  VITE_YMAP_KEY: import.meta.env.VITE_YMAP_KEY,
  VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

export { EnvSchema };
