// Unit-тест EnvSchema под FOUND-10 acceptance.
// Дублирует src/shared/config/env.test.ts (Plan 01) — оставляем оба, потому что
// файл tests/unit/env.spec.ts фигурирует в Plan 02 acceptance buffer'е, а
// src/shared/config/env.test.ts даёт co-located test для FSD slice-владельца.
import { describe, it, expect } from 'vitest';
import { EnvSchema } from '@/shared/config/env';

describe('EnvSchema (tests/unit/env.spec.ts)', () => {
  it('parses a well-formed config', () => {
    const r = EnvSchema.parse({
      VITE_YMAP_KEY: 'k',
      VITE_API_BASE_URL: 'https://x.example.com',
    });
    expect(r.VITE_YMAP_KEY).toBe('k');
  });

  it('throws on empty VITE_YMAP_KEY', () => {
    expect(() => EnvSchema.parse({ VITE_YMAP_KEY: '' })).toThrow();
  });

  it('defaults VITE_API_BASE_URL', () => {
    const r = EnvSchema.parse({ VITE_YMAP_KEY: 'k' });
    expect(r.VITE_API_BASE_URL).toBe('https://api.parktrack.live');
  });

  it('defaults VITE_API_MODE to mock', () => {
    const r = EnvSchema.parse({ VITE_YMAP_KEY: 'k' });
    expect(r.VITE_API_MODE).toBe('mock');
  });

  it('defaults the route geometry endpoint', () => {
    const r = EnvSchema.parse({ VITE_YMAP_KEY: 'k' });
    expect(r.VITE_ROUTING_GEOMETRY_BASE_URL).toBe('https://router.project-osrm.org');
  });
});
