import { describe, expect, it } from 'vitest';
import { formatDistanceFromMeters } from './distance';

describe('formatDistanceFromMeters', () => {
  it('keeps short distances in meters', () => {
    expect(formatDistanceFromMeters(850, 'ru')).toBe('850 м');
    expect(formatDistanceFromMeters(850, 'en')).toBe('850 m');
  });

  it('uses localized kilometers for long distances', () => {
    expect(formatDistanceFromMeters(1250, 'ru')).toBe('1,3 км');
    expect(formatDistanceFromMeters(1250, 'en')).toBe('1.3 km');
    expect(formatDistanceFromMeters(2000, 'ru')).toBe('2 км');
  });

  it('handles the unit boundary and invalid input', () => {
    expect(formatDistanceFromMeters(1000, 'en')).toBe('1 km');
    expect(formatDistanceFromMeters(Number.NaN, 'ru')).toBe('0 м');
  });
});
