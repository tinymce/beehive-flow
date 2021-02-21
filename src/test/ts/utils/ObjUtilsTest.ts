import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as ObjUtils from '../../../main/ts/utils/ObjUtils';

describe('ObjUtils', () => {
  describe('fromPairs', () => {
    it('returns empty object for empty array', () => {
      assert.deepEqual(ObjUtils.fromPairs([]), {});
    });

    it('returns single-key object for single-element array', () => {
      fc.assert(fc.property(fc.string(), fc.nat(), (k, v) => {
        assert.deepEqual(ObjUtils.fromPairs([[ k, v ]]), { [k]: v });
      }));
    });

    it('returns correct objects for larger arrays', () => {
      assert.deepEqual(
        ObjUtils.fromPairs([[ 'a', 'zingo' ], [ 'hasOwnProperty', '*' ]]),
        { a: 'zingo', hasOwnProperty: '*' }
      );
    });
  });
});
