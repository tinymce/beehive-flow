import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Advance from '../../../main/ts/commands/Advance';
import * as Version from '../../../main/ts/core/Version';

describe('Advance', () => {

  describe('updateVersion', () => {
    it('Updates versions', () => {
      const check = (input: string, expected: string): void => {
        assert.equal(Version.versionToString(Advance.updateVersion(Version.parseVersionOrThrow(input))), expected);
      };
      check('0.0.0', '0.0.1-rc');
      check('1.0.0', '1.0.1-rc');
      check('0.300.100', '0.300.101-rc');
    });
  });
});
