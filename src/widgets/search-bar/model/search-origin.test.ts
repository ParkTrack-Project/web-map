import { describe, expect, it } from 'vitest';
import { originForAddressSelection } from './search-origin';

describe('originForAddressSelection', () => {
  it('never substitutes the selected address for the user origin', () => {
    expect(originForAddressSelection(null)).toBeNull();
  });

  it('preserves an existing user origin', () => {
    expect(originForAddressSelection([59, 30])).toEqual([59, 30]);
  });
});
