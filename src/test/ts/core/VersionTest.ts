import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as E from 'fp-ts/Either';
import * as Version from '../../../main/ts/core/Version';
import * as EitherUtils from '../../../main/ts/utils/EitherUtils';

describe('Version', () => {
  describe('parseVersion', () => {
    it('parses a correct 3-point version', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), (major, minor, patch) => {
        const input = `${major}.${minor}.${patch}`;
        const actual = Version.parseVersion(input);
        const expected = E.right({ major, minor, patch, preRelease: undefined, buildMetaData: undefined });
        assert.deepEqual(actual, expected);
      }));
    });

    it('fails on 2-point versions', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), (major, minor) => {
        const input = `${major}.${minor}`;
        const actual = Version.parseVersion(input);
        const expected = E.left('Could not parse version string');
        assert.deepEqual(actual, expected);
      }));
    });

    it('parses a correct 3-point version with preRelease', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(0, 100), (major, minor, patch, preRelease) => {
        const input = `${major}.${minor}.${patch}-${preRelease}`;
        const actual = Version.parseVersion(input);
        const expected = E.right({ major, minor, patch, preRelease: String(preRelease), buildMetaData: undefined });
        assert.deepEqual(actual, expected);
      }));
    });

    it('parses a correct 3-point version with buildmeta', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(1, 100), (major, minor, patch, buildMetaData) => {
        const input = `${major}.${minor}.${patch}+${buildMetaData}`;
        const actual = Version.parseVersion(input);
        const expected = E.right({ major, minor, patch, preRelease: undefined, buildMetaData: String(buildMetaData) });
        assert.deepEqual(actual, expected);
      }));
    });
  });

  describe('isReleaseVersion', () => {
    it('returns true for normal 3-point versions', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), (major, minor, patch) => {
        assert.isTrue(Version.isReleaseVersion({ major, minor, patch }));
        assert.isTrue(Version.isReleaseVersion({ major, minor, patch, buildMetaData: undefined }));
        assert.isTrue(Version.isReleaseVersion({ major, minor, patch, preRelease: undefined }));
        assert.isTrue(Version.isReleaseVersion({ major, minor, patch, buildMetaData: undefined, preRelease: undefined }));
      }));
    });

    it('returns false if buildmetadata is specified', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(0, 100).map(String),
        (major, minor, patch, buildMetaData) => {
          assert.isFalse(Version.isReleaseVersion({ major, minor, patch, buildMetaData }));
          assert.isFalse(Version.isReleaseVersion({ major, minor, patch, buildMetaData, preRelease: undefined }));
        }));
    });

    it('returns false if prerelease is specified', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(0, 100).map(String),
        (major, minor, patch, preRelease) => {
          assert.isFalse(Version.isReleaseVersion({ major, minor, patch, preRelease }));
          assert.isFalse(Version.isReleaseVersion({ major, minor, patch, preRelease, buildMetaData: undefined }));
        }));
    });

    it('returns false if prerelease and buildmetadata are specified', () => {
      fc.assert(fc.property(
        fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(0, 100).map(String), fc.integer(0, 100).map(String),
        (major, minor, patch, preRelease, buildMetaData) => {
          assert.isFalse(Version.isReleaseVersion({ major, minor, patch, preRelease, buildMetaData }));
        }));
    });
  });

  describe('versionToString', () => {
    it('round-trips for 3-point version', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), (major, minor, patch) => {
        const sVersion = `${major}.${minor}.${patch}`;
        const version = EitherUtils.getOrThrow(Version.parseVersion(sVersion));
        const actual = Version.versionToString(version);
        assert.deepEqual(actual, sVersion);
      }));
    });

    it('round-trips for version with buildmeta', () => {
      fc.assert(fc.property(fc.integer(0, 200), fc.integer(0, 200), fc.integer(0, 100), fc.integer(0, 100).map(String),
        (major, minor, patch, preRelease) => {
          const input = `${major}.${minor}.${patch}-${preRelease}`;
          const version = EitherUtils.getOrThrow(Version.parseVersion(input));
          const actual = Version.versionToString(version);
          assert.deepEqual(actual, input);
        }
      ));
    });
  });
});
