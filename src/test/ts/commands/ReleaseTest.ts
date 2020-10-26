import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Release from '../../../main/ts/commands/Release';
import * as Version from '../../../main/ts/core/Version';

describe('Advance', () => {
  describe('updateVersion', () => {
    it('Updates versions', () => {
      const check = (input: string, expected: string): void => {
        assert.equal(Version.versionToString(Release.updateVersion(Version.parseVersionOrThrow(input))), expected);
      };
      check('0.0.0-rc', '0.0.0');
      check('1.0.0-rc', '1.0.0');
      check('0.300.100-rc', '0.300.100');
    });
  });
});
