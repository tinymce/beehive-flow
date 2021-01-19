import * as PromiseUtils from '../utils/PromiseUtils';
import { Comparison, fromNumber } from '../utils/Comparison';

export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly preRelease?: string;
  readonly buildMetaData?: string;
}

export interface MajorMinorVersion {
  readonly major: number;
  readonly minor: number;
}

export const parseVersion = async (input: string): Promise<Version> => {
  // based on https://semver.org/
  // eslint-disable-next-line max-len
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const r = regexp.exec(input);

  if (r === null || r.groups === undefined) {
    return PromiseUtils.fail('Could not parse version string: ' + input);
  } else {
    const g = r.groups;
    // The regexp should guarantee that these are positive integers
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    const patch = parseInt(g.patch, 10);
    const preRelease = r.groups.prerelease;
    const buildMetaData = r.groups.buildmetadata;

    return {
      major,
      minor,
      patch,
      preRelease,
      buildMetaData
    };
  }
};

export const parseMajorMinorVersion = async (input: string): Promise<MajorMinorVersion> => {
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)$/;
  const r = regexp.exec(input);
  if (r === null || r.groups === undefined) {
    return PromiseUtils.fail('Could not parse major.minor version string');
  } else {
    const g = r.groups;
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    return { major, minor };
  }
};

export const majorMinorVersionToString = (v: MajorMinorVersion): string =>
  `${v.major}.${v.minor}`;

export const versionToString = (v: Version): string => {
  const preBit = v.preRelease === undefined ? '' : '-' + v.preRelease;
  const metaBit = v.buildMetaData === undefined ? '' : '+' + v.buildMetaData;
  return [ v.major, v.minor, v.patch ].join('.') + preBit + metaBit;
};

export const compareMajorMinorVersions = (a: MajorMinorVersion, b: MajorMinorVersion): Comparison =>
  fromNumber(a.major !== b.major ? a.major - b.major : a.minor - b.minor);

export const isPreRelease = (v: Version): boolean =>
  v.preRelease !== undefined;

/**
 * Compares two versions on their major, minor and prerelease versions.
 * Per semver:
 * - released versions beat prerelease versions for the same major.minor.patch
 * - buildMeta is not considered
 *
 * Might not be suitable for sorting.
 *
 * @param a
 * @param b
 */
export const compareVersions = (a: Version, b: Version): Comparison => {
  if (a.major !== b.major) {
    return fromNumber(a.major - b.major);
  } else if (a.minor !== b.minor) {
    return fromNumber(a.minor - b.minor);
  } else if (a.patch !== b.patch) {
    return fromNumber(a.patch - b.patch);
  } else {
    if (a.preRelease === b.preRelease) {
      return Comparison.EQ;
    } else if (a.preRelease === undefined) {
      // a is a release, b is a prerelease - a > b
      return Comparison.GT;
    } else {
      // a is a prerelease, b is a release - a < b
      return Comparison.LT;
    }
  }
};
