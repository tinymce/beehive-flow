import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as E from 'fp-ts/Either';

import * as EitherUtils from '../../../main/ts/utils/EitherUtils';

describe('EitherUtils.getOrThrow', () => {
  it('Returns value for right', () => {
    fc.assert(fc.property(fc.integer(), (i) => {
      assert.deepEqual(EitherUtils.getOrThrow(E.right(i)), i);
    }));
  });

  it('Throws for left', () => {
    fc.assert(fc.property(fc.integer(), (i) => {
      assert.throws(() => {
        EitherUtils.getOrThrow(E.left(i));
      }, Error, String(i));
    }));
  });

  it('Throws with message for left', () => {
    fc.assert(fc.property(fc.integer(), (i) => {
      assert.throws(() => {
        EitherUtils.getOrThrow(E.left(i), (i) => new Error(`${i}boom`));
      }, Error, `${i}boom`);
    }));
  });
});
