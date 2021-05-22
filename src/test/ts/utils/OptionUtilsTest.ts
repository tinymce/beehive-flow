import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as O from 'fp-ts/Option';
import * as OptionUtils from '../../../main/ts/utils/OptionUtils';

describe('OptionUtils', () => {
  describe('somes', () => {
    it('is identity when all elements are some', () => {
      fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
        assert.deepEqual(
          OptionUtils.somes(xs.map(O.some)),
          xs
        );
      }));
    });

    it('returns empty array when all elements are none', () => {
      fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
        assert.deepEqual(
          OptionUtils.somes(xs.map(() => O.none)),
          []
        );
      }));
    });

    it('gets the somes', () => {
      assert.deepEqual(
        OptionUtils.somes([ O.none, O.some(1), O.some(2), O.none, O.some(7) ]),
        [ 1, 2, 7 ]
      );
    });
  });
});
