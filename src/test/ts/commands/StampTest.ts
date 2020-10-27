import { describe, it } from 'mocha';
import { DateTime } from 'luxon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Stamp from '../../../main/ts/commands/Stamp';

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

  // TODO: Rewrite
  // describe('validateBranchAndChooseNewVersion', () => {
  //   describe('behaviour on main branch', () => {
  //     it('fails if version is missing prerelease', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('main', 123));
  //     });
  //     it('fails if version has wrong prerelease', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('main', 123));
  //     });
  //     it('fails if version has wrong minor', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('main', 123));
  //     });
  //     it('fails if version has wrong minor and wrong prerelease', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('main', 123));
  //     });
  //     it('passes if version is valid', async () => {
  //       const actual = await Stamp.chooseNewVersion('main', 1603695425074);
  //       const sactual = Version.versionToString(actual);
  //       assert.equal(sactual, '1.2.0-alpha.20201026065705074+b0d52ad');
  //     });
  //   });
  //
  //   describe('behaviour on feature branch', () => {
  //     it('passes if version is valid', async () => {
  //       await fc.assert(fc.asyncProperty(fc.nat(), fc.nat(), async (major, minor) => {
  //         const patch = 0;
  //         const v = `${major}.${minor}.${patch}-main`;
  //         const actual = await Stamp.chooseNewVersion('feature/TINY-1234', 1603695425074);
  //         const sactual = Version.versionToString(actual);
  //         assert.equal(sactual, `${major}.${minor}.${patch}-feature.20201026065705074+b0d52ad`);
  //       }));
  //     });
  //   });
  //
  //   describe('behaviour on hotfix branch', () => {
  //     it('passes if version is valid', async () => {
  //       const actual = await Stamp.chooseNewVersion('hotfix/TINY-1234', 1603695425074);
  //       const sactual = Version.versionToString(actual);
  //       assert.equal(sactual, '1.2.0-hotfix.20201026065705074+b0d52ad');
  //     });
  //   });
  //
  //   describe('behaviour on release branch', () => {
  //     it('fails on version mismatch', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('release/1.2', 123));
  //     });
  //     it('fails on wrong prerelease', async () => {
  //       await assert.isRejected(Stamp.chooseNewVersion('release/1.2', 123));
  //     });
  //     it('passes if version is valid, but does not change the version', async () => {
  //       await fc.assert(fc.asyncProperty(fc.nat(), fc.nat(), fc.nat(), async (major, minor, patch) => {
  //         const v = `${major}.${minor}.${patch}`;
  //         const actual = await Stamp.chooseNewVersion(`release/${major}.${minor}`, 1603695425074);
  //         const sactual = Version.versionToString(actual);
  //         assert.equal(sactual, v);
  //       }));
  //     });
  //   });
  // });
});
