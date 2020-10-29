import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Release from '../../../main/ts/commands/Release';
import * as Version from '../../../main/ts/core/Version';

describe('Release', () => {
  describe('updateVersion', () => {
    it('Updates versions', async () => {
      const check = async (input: string, expected: string) => {
        assert.equal(Version.versionToString(Release.updateVersion(await Version.parseVersion(input))), expected);
      };
      await check('0.0.0-rc', '0.0.0');
      await check('1.0.0-rc', '1.0.0');
      await check('0.300.100-rc', '0.300.100');
    });
  });
});
