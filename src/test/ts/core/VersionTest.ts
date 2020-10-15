import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as E from 'fp-ts/Either';
import * as Version from '../../../main/ts/core/Version';

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
});
