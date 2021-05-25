import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as AdvanceVersion from '../../../main/ts/core/AdvanceVersion';
import * as Version from '../../../main/ts/core/Version';

describe('AdvanceVersion', () => {
  describe('updateToNextPatch', () => {
    it('Updates version to next RC patch version', async () => {
      const check = async (input: string, expected: string) => {
        const newVersion = AdvanceVersion.updateToNextPatch(await Version.parseVersion(input));
        assert.equal(Version.versionToString(newVersion), expected);
      };
      await check('0.0.0', '0.0.1-rc');
      await check('1.0.0', '1.0.1-rc');
      await check('0.300.100', '0.300.101-rc');
    });
  });

  describe('updateToNextMinor', () => {
    it('Updates version to next RC minor version', async () => {
      const check = async (input: string, expected: string) => {
        const newVersion = AdvanceVersion.updateToNextMinor(await Version.parseVersion(input));
        assert.equal(Version.versionToString(newVersion), expected);
      };
      await check('0.0.0', '0.1.0-rc');
      await check('1.0.0', '1.1.0-rc');
      await check('0.300.100', '0.301.0-rc');
      await check('1.0.5-rc', '1.1.0-rc');
    });
  });

  describe('updateToStable', () => {
    it('Updates versions from RC to stable', async () => {
      const check = async (input: string, expected: string) => {
        const newVersion = AdvanceVersion.updateToStable(await Version.parseVersion(input));
        assert.equal(Version.versionToString(newVersion), expected);
      };
      await check('0.0.0-rc', '0.0.0');
      await check('1.0.0-rc', '1.0.0');
      await check('0.300.100-rc', '0.300.100');
    });
  });
});