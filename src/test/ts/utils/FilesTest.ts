import { describe, it } from 'mocha';
import { assert } from 'chai';

import * as tmp from 'tmp';
import * as fs from 'fs';
import * as E from 'fp-ts/Either';
import fc from 'fast-check';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';
import * as Files from '../../../main/ts/utils/Files';

type Either<R, A> = E.Either<R, A>;

describe('Files.fileMustExist', () => {
  it('Passes when file exists', async () => {
    const { name } = tmp.fileSync();
    await Files.fileMustExist(name);
  });

  it('Fails when file does not exist', async () => {
    const { name } = tmp.fileSync();
    fs.unlinkSync(name);
    const actual = await PromiseUtils.tryPromise(Files.fileMustExist(name)) as Either<Error, void>;
    const message = E.mapLeft((e: Error) => e.message)(actual);
    assert.deepEqual(message, E.left(`file not found: ${name}`));
  });
});

describe('Files.writeFile/Files.readFile', () => {
  it('reads the written content', () => {
    fc.assert(fc.asyncProperty(fc.string(), async (contents) => {
      const { name } = tmp.fileSync();
      fs.unlinkSync(name);
      await Files.writeFile(name, contents);
      const actual = await Files.readFileAsString(name);
      assert.deepEqual(actual, contents);

      const actualBuffer = await Files.readFile(name);
      assert.deepEqual(actualBuffer.toString(), contents);
    }), { numRuns: 3 });
  });
});
