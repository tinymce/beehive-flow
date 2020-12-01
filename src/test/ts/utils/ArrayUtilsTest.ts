import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as ArrayUtils from '../../../main/ts/utils/ArrayUtils';

describe('ArrayUtils', () => {
  describe('sort', () => {
    it('returns the same number of elements', () => {
      fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
        assert.equal(ArrayUtils.sort(xs).length, xs.length);
      }));
    });
    it('does not mutate', () => {
      const input = [ 1, 2, 3 ]; // do not inline
      assert.notEqual(ArrayUtils.sort(input), input);
    });
  });
});
