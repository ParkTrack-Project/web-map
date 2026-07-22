import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { EnvSchema } from './env';

describe('EnvSchema', () => {
  it('parses a well-formed env object', () => {
    const result = EnvSchema.parse({
      VITE_YMAP_KEY: 'test-key-123',
      VITE_API_BASE_URL: 'https://api.parktrack.live',
    });

    expect(result.VITE_YMAP_KEY).toBe('test-key-123');
    expect(result.VITE_API_BASE_URL).toBe('https://api.parktrack.live');
  });

  it('throws ZodError when VITE_YMAP_KEY is empty', () => {
    expect(() =>
      EnvSchema.parse({
        VITE_YMAP_KEY: '',
        VITE_API_BASE_URL: 'https://api.parktrack.live',
      }),
    ).toThrow(ZodError);
  });

  it("defaults VITE_API_BASE_URL to 'https://api.parktrack.live' when undefined", () => {
    const result = EnvSchema.parse({
      VITE_YMAP_KEY: 'x',
    });

    expect(result.VITE_API_BASE_URL).toBe('https://api.parktrack.live');
  });

  it('defaults route geometry to the OSRM demo endpoint', () => {
    const result = EnvSchema.parse({ VITE_YMAP_KEY: 'x' });
    expect(result.VITE_ROUTING_GEOMETRY_BASE_URL).toBe('https://router.project-osrm.org');
  });

  it("defaults VITE_API_MODE to 'mock' when undefined", () => {
    const result = EnvSchema.parse({
      VITE_YMAP_KEY: 'x',
    });

    expect(result.VITE_API_MODE).toBe('mock');
  });
});
