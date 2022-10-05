import * as fs from 'fs';
import { describe, it } from 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import * as tmp from 'tmp';
import fc from 'fast-check';
import * as Files from '../../../main/ts/utils/Files';

const assert = chai.use(chaiAsPromised).assert;

describe('Files', () => {
  describe('writeFile/readFile', () => {
    it('reads the written content', async () => {
      await fc.assert(fc.asyncProperty(fc.string(), async (contents) => {
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
});
