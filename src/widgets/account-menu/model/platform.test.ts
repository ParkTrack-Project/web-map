import { describe, expect, it } from 'vitest';
import { detectMobilePlatform } from './platform';

describe('detectMobilePlatform', () => {
  it('detects Android using userAgentData', () => {
    expect(
      detectMobilePlatform({
        userAgentDataPlatform: 'Android',
        userAgent: 'Chrome',
        maxTouchPoints: 5,
      }),
    ).toBe('android');
  });

  it('detects iPhone and modern iPadOS', () => {
    expect(detectMobilePlatform({ userAgent: 'Mozilla iPhone', maxTouchPoints: 5 })).toBe('ios');
    expect(detectMobilePlatform({ userAgent: 'Mozilla Macintosh', maxTouchPoints: 5 })).toBe('ios');
  });

  it('keeps desktop platforms as other', () => {
    expect(
      detectMobilePlatform({
        userAgentDataPlatform: 'macOS',
        userAgent: 'Macintosh',
        maxTouchPoints: 0,
      }),
    ).toBe('other');
  });
});
