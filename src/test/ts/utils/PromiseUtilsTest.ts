import { describe, it } from 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fc from 'fast-check';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';

const assert = chai.use(chaiAsPromised).assert;

describe('PromiseUtils', () => {
  describe('fail', () => {
    it('fails', async () => {
      await assert.isRejected(PromiseUtils.fail());
    });

    it('fails with a message', async () => {
      await fc.assert(fc.asyncProperty(fc.string(), async (s) => {
        await assert.isRejected(PromiseUtils.fail(s), s);
      }));
    });
  });

  describe('succeed', () => {
    it('succeeds', async () => {
      await fc.assert(fc.asyncProperty(fc.integer(), async (i) => {
        const actual = await PromiseUtils.succeed(i);
        assert.equal(actual, i);
      }));
    });
  });

  describe('eitherToPromise', () => {
    it('succeeds for right', async () => {
      await fc.assert(fc.asyncProperty(fc.integer(), async (i) => {
        const actual = await PromiseUtils.eitherToPromise(E.right(i));
        assert.equal(actual, i);
      }));
    });

    it('fails for left', async () => {
      await fc.assert(fc.asyncProperty(fc.string(), async (s) => {
        const p = PromiseUtils.eitherToPromise(E.left(s));
        await assert.isRejected(p, s);
      }));
    });
  });

  describe('optionToPromise', () => {
    it('succeeds for some', async () => {
      await fc.assert(fc.asyncProperty(fc.integer(), async (i) => {
        const actual = await PromiseUtils.optionToPromise(O.some(i));
        assert.equal(actual, i);
      }));
    });

    it('fails for none', async () => {
      const p = PromiseUtils.optionToPromise(O.none);
      await assert.isRejected(p);
    });
  });

  describe('tryPromise', () => {
    it('succeeds with right on success', async () => {
      await fc.assert(fc.asyncProperty(fc.integer(), async (i) => {
        await assert.becomes(PromiseUtils.tryPromise(PromiseUtils.succeed(i)), E.right(i));
      }));
    });
  });

  it('succeeds with left on failure', async () => {
    await fc.assert(fc.asyncProperty(fc.integer(), async (i) => {
      await assert.becomes(PromiseUtils.tryPromise(PromiseUtils.fail(i)), E.left(i));
    }));
  });

  describe('filterMap', () => {
    it('maps', async () => {
      await fc.assert(fc.asyncProperty(fc.array(fc.integer()), async (xs) => {
        await assert.becomes(
          PromiseUtils.filterMap(xs, (x) => PromiseUtils.succeed(x + 1)),
          xs.map((x) => x + 1)
        );
      }));
    });

    it('filters', async () => {
      await fc.assert(fc.asyncProperty(fc.array(fc.integer()), async (xs) => {
        await assert.becomes(
          PromiseUtils.filterMap(xs, (x) => x > 5 ? PromiseUtils.succeed(x) : PromiseUtils.fail(x)),
          xs.filter((x) => x > 5)
        );
      }));
    });
  });
});

