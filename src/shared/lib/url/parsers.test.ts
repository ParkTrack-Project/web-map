import { describe, it, expect, vi } from 'vitest';
import { parseAsCoords, parseAsRouteId } from './parsers';

describe('parseAsCoords (D-17)', () => {
  it('parses valid 5-precision lat,lon', () => {
    expect(parseAsCoords.parse('59.95598,30.30943')).toEqual([59.95598, 30.30943]);
  });
  it('returns null for lat > 90', () => {
    expect(parseAsCoords.parse('91.0,30.0')).toBeNull();
  });
  it('returns null for lat < -90', () => {
    expect(parseAsCoords.parse('-91.0,30.0')).toBeNull();
  });
  it('returns null for lon > 180', () => {
    expect(parseAsCoords.parse('59.0,181.0')).toBeNull();
  });
  it('returns null for non-numeric input + warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseAsCoords.parse('abc,xyz')).toBeNull();
    expect(warn).toHaveBeenCalledWith('[url] invalid coords:', 'abc,xyz');
    warn.mockRestore();
  });
  it('returns null for precision > 5 digits', () => {
    expect(parseAsCoords.parse('59.955981234,30.30943')).toBeNull();
  });
  it('serialize returns 5-digit toFixed', () => {
    expect(parseAsCoords.serialize([59.955976, 30.309426])).toBe('59.95598,30.30943');
  });
  it('eq identity check', () => {
    expect(parseAsCoords.eq([59.95598, 30.30943], [59.95598, 30.30943])).toBe(true);
    expect(parseAsCoords.eq([59.95598, 30.30943], [59.95599, 30.30943])).toBe(false);
  });
});

describe('parseAsRouteId', () => {
  it('parses positive integer', () => {
    expect(parseAsRouteId.parse('7001')).toBe(7001);
  });
  it('rejects float', () => {
    expect(parseAsRouteId.parse('7001.5')).toBeNull();
  });
  it('rejects negative', () => {
    expect(parseAsRouteId.parse('-1')).toBeNull();
  });
  it('rejects zero (route_id must be positive per API)', () => {
    expect(parseAsRouteId.parse('0')).toBeNull();
  });
  it('rejects non-numeric', () => {
    expect(parseAsRouteId.parse('abc')).toBeNull();
  });
  it('serialize returns String(n)', () => {
    expect(parseAsRouteId.serialize(7001)).toBe('7001');
  });
  it('eq identity', () => {
    expect(parseAsRouteId.eq(7001, 7001)).toBe(true);
    expect(parseAsRouteId.eq(7001, 7002)).toBe(false);
  });
});
