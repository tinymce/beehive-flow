import { describe, it } from 'mocha';
import { assert } from 'chai';
import { DateTime } from 'luxon';
import * as Stamp from '../../../main/ts/commands/Stamp';
import * as Version from '../../../main/ts/core/Version';

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
    });
  });
});
