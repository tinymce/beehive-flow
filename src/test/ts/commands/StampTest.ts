import { describe, it } from 'mocha';
import { DateTime } from 'luxon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import fc from 'fast-check';
import * as Stamp from '../../../main/ts/commands/Stamp';
import * as Version from '../../../main/ts/core/Version';
import { BranchState } from '../../../main/ts/core/BranchLogic';

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

  describe('chooseNewVersion', () => {
    const timeMillis = 1603695425074;
    const timeFormatted = '20201026065705074';

    it('makes a timestamped version on main branch', async () => {
      const actual = Stamp.chooseNewVersion(BranchState.ReleaseCandidate, await Version.parseVersion('1.2.0-alpha'), 'b0d52ad', timeMillis);
      assert.equal(Version.versionToString(actual), `1.2.0-alpha.${timeFormatted}.shab0d52ad`);
    });

    it('makes a timestamped version on feature branch', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(), fc.nat(), async (major, minor) => {
        const patch = 0;
        const v = `${major}.${minor}.${patch}-main`;
        const actual = Stamp.chooseNewVersion(BranchState.Feature, await Version.parseVersion(v), 'b0d59ad', timeMillis);
        assert.equal(Version.versionToString(actual), `${major}.${minor}.${patch}-feature.${timeFormatted}.shab0d59ad`);
      }));
    });

    it('makes a timestamped version on hotfix branch', async () => {
      const actual = Stamp.chooseNewVersion(BranchState.Hotfix, await Version.parseVersion('1.2.0-rc'), 'f0d52ad', timeMillis);
      assert.equal(Version.versionToString(actual), `1.2.0-hotfix.${timeFormatted}.shaf0d52ad`);
    });

    it('makes a timestamped version in rc state', async () => {
      const actual = Stamp.chooseNewVersion(BranchState.ReleaseCandidate, await Version.parseVersion('1.2.0-rc'), 'f0d52ad', timeMillis);
      assert.equal(Version.versionToString(actual), `1.2.0-rc.${timeFormatted}.shaf0d52ad`);
    });

    it('does not change version for release version', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(), fc.nat(), fc.nat(), async (major, minor, patch) => {
        const v = `${major}.${minor}.${patch}`;
        const actual = Stamp.chooseNewVersion(BranchState.ReleaseReady, await Version.parseVersion(v), 'aorseitnoarsetn', timeMillis);
        assert.equal(Version.versionToString(actual), v);
      }));
    });
  });
});
