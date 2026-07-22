import { describe, expect, it } from 'vitest';
import { isYandexNavigatorAvailable } from './capabilities';

describe('isYandexNavigatorAvailable', () => {
  it('is false when the browser cannot confirm a registered handler', () => {
    expect(isYandexNavigatorAvailable({})).toBe(false);
  });

  it('is true when a trusted host registers the yandexnavi handler', () => {
    expect(isYandexNavigatorAvailable({ __parktrackProtocolHandlers: ['yandexnavi'] })).toBe(true);
  });
});
