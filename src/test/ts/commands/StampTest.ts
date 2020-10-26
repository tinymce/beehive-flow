import { describe, it } from 'mocha';
import { DateTime } from 'luxon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Stamp from '../../../main/ts/commands/Stamp';
import * as Version from '../../../main/ts/core/Version';

const assert = chai.use(chaiAsPromised).assert;

describe('Stamp', () => {
  describe('formatDate', () => {
    it('Outputs parseable dates', () => {
      // Not sure exactly how to test that the output is actually in UTC.
      const now = Date.now();
      const formatted = Stamp.formatDate(now);
      const backToMillis = DateTime.fromFormat(formatted, Stamp.timeFormat, { zone: 'utc' }).toMillis();
      assert.equal(backToMillis, now);
    });
  });

  describe('validateBranchAndChooseNewVersion', () => {
    describe('behaviour on main branch', () => {
      it('fails if version is missing prerelease', async () => {
        await assert.isRejected(Stamp.validateBranchAndChooseNewVersion('main', Version.parseVersionOrThrow('1.2.0'), 'blah', 123));
      });
      it('fails if version has wrong prerelease', async () => {
        await assert.isRejected(Stamp.validateBranchAndChooseNewVersion('main', Version.parseVersionOrThrow('1.2.0-rc'), 'blah', 123));
      });
      it('fails if version has wrong minor', async () => {
        await assert.isRejected(Stamp.validateBranchAndChooseNewVersion('main', Version.parseVersionOrThrow('1.2.8-main'), 'blah', 123));
      });
      it('fails if version has wrong minor and wrong prerelease', async () => {
        await assert.isRejected(Stamp.validateBranchAndChooseNewVersion('main', Version.parseVersionOrThrow('1.2.8-frog'), 'blah', 123));
      });
      it('passes if version is valid', async () => {
        const actual = await Stamp.validateBranchAndChooseNewVersion('main', Version.parseVersionOrThrow('1.2.0-main'), 'b0d52ad', 1603695425074);
        const sactual = Version.versionToString(actual);
        assert.equal(sactual, '1.2.0-alpha.main.20201026065705074+b0d52ad');
      });
    });

    describe('behaviour on feature branch', () => {
      it('passes if version is valid', async () => {
        const actual = await Stamp.validateBranchAndChooseNewVersion('feature/TINY-1234', Version.parseVersionOrThrow('1.2.0-main'), 'b0d52ad', 1603695425074);
        const sactual = Version.versionToString(actual);
        assert.equal(sactual, '1.2.0-alpha.feature.20201026065705074+b0d52ad');
      });
    });

    describe('behaviour on hotfix branch', () => {
      it('passes if version is valid', async () => {
        const actual = await Stamp.validateBranchAndChooseNewVersion('hotfix/TINY-1234', Version.parseVersionOrThrow('1.2.0-main'), 'b0d52ad', 1603695425074);
        const sactual = Version.versionToString(actual);
        assert.equal(sactual, '1.2.0-hotfix.20201026065705074+b0d52ad');
      });
    });
  });
});
