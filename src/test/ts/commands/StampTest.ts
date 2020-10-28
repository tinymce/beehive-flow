import { describe, it } from 'mocha';
import { DateTime } from 'luxon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import fc from 'fast-check';
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

  describe('chooseNewVersion', () => {
    it('makes a timestamped version on main branch', () => {
      const actual = Stamp.chooseNewVersion({ kind: 'Main', version: Version.parseVersionOrThrow('1.2.0-alpha') }, 'b0d52ad', 1603695425074);
      assert.equal(Version.versionToString(actual), '1.2.0-alpha.20201026065705074+b0d52ad');
    });

    it('makes a timestamped version on feature branch', () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), (major, minor) => {
        const patch = 0;
        const v = `${major}.${minor}.${patch}-main`;
        const actual = Stamp.chooseNewVersion({ kind: 'Feature', version: Version.parseVersionOrThrow(v) }, 'b0d59ad', 1603695425074);
        assert.equal(Version.versionToString(actual), `${major}.${minor}.${patch}-feature.20201026065705074+b0d59ad`);
      }));
    });

    it('makes a timestamped version on hotfix branch', () => {
      const actual = Stamp.chooseNewVersion({ kind: 'Hotfix', version: Version.parseVersionOrThrow('1.2.0-rc') }, 'f0d52ad', 1603695425074);
      assert.equal(Version.versionToString(actual), '1.2.0-hotfix.20201026065705074+f0d52ad');
    });

    it('makes a timestamped version in rc state', () => {
      const actual = Stamp.chooseNewVersion({ kind: 'ReleaseCandidate', version: Version.parseVersionOrThrow('1.2.0-rc') }, 'f0d52ad', 1603695425074);
      assert.equal(Version.versionToString(actual), '1.2.0-rc.20201026065705074+f0d52ad');
    });

    it('does not change version for release version', () => {
      fc.assert(fc.property(fc.nat(), fc.nat(), fc.nat(), (major, minor, patch) => {
        const v = `${major}.${minor}.${patch}`;
        const actual = Stamp.chooseNewVersion({ kind: 'Release', version: Version.parseVersionOrThrow(v) }, 'aorseitnoarsetn', 1603695425074);
        assert.equal(Version.versionToString(actual), v);
      }));
    });
  });
});
