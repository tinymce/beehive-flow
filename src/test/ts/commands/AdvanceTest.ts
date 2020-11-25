import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Advance from '../../../main/ts/commands/Advance';
import * as Version from '../../../main/ts/core/Version';

describe('Advance', () => {

  describe('updateVersion', () => {
    it('Updates versions', async () => {
      const check = async (input: string, expected: string) => {
        assert.equal(Version.versionToString(Advance.updateVersion(await Version.parseVersion(input))), expected);
      };
      await check('0.0.0', '0.0.1-rc');
      await check('1.0.0', '1.0.1-rc');
      await check('0.300.100', '0.300.101-rc');
    });
  });
});
