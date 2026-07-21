import { describe, expect, it } from 'vitest';
import { originForAddressSelection } from './search-origin';

describe('originForAddressSelection', () => {
  it('uses the address to start parking search when origin is missing', () => {
    expect(originForAddressSelection(null, [60, 31])).toEqual([60, 31]);
  });

  it('preserves an existing user origin', () => {
    expect(originForAddressSelection([59, 30], [60, 31])).toBeNull();
  });
});
