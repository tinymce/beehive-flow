import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as E from 'fp-ts/Either';
import * as EitherUtils from '../../../main/ts/utils/EitherUtils';

describe('EitherUtils', () => {
  describe('rights', () => {
    it('is identity when all elements are right', () => {
      fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
        assert.deepEqual(
          EitherUtils.rights(xs.map(E.right)),
          xs
        );
      }));
    });
    it('returns empty array when all elements are left', () => {
      fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
        assert.deepEqual(
          EitherUtils.rights(xs.map(E.left)),
          []
        );
      }));
    });
    it('gets the rights', () => {
      assert.deepEqual(
        EitherUtils.rights([ E.left('no'), E.right(1), E.right(2), E.left('cat'), E.right(7) ]),
        [ 1, 2, 7 ]
      );
    });
  });
});
