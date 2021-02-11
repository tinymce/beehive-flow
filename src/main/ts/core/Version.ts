import * as E from 'fp-ts/Either';
import * as PromiseUtils from '../utils/PromiseUtils';
import { Comparison, chain, chainN, compareNative } from '../utils/Comparison';
import { showStringOrUndefined } from '../utils/StringUtils';
import * as PreRelease from './PreRelease';

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

export const parseVersionE = (input: string): E.Either<string, Version> => {
  // based on https://semver.org/
  // eslint-disable-next-line max-len
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const r = regexp.exec(input);

  if (r === null || r.groups === undefined) {
    return E.left('Could not parse version string: ' + input);
  } else {
    const g = r.groups;
    // The regexp should guarantee that these are positive integers
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    const patch = parseInt(g.patch, 10);
    const preRelease = r.groups.prerelease;
    const buildMetaData = r.groups.buildmetadata;

    return E.right({
      major,
      minor,
      patch,
      preRelease,
      buildMetaData
    });
  }
};

export const parseVersion = async (input: string): Promise<Version> =>
  PromiseUtils.eitherToPromise(parseVersionE(input));

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
  chain(
    compareNative(a.major, b.major),
    compareNative(a.minor, b.minor)
  );

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
export const compareVersions = (a: Version, b: Version): Comparison =>
  chainN(
    compareNative(a.major, b.major),
    compareNative(a.minor, b.minor),
    compareNative(a.patch, b.patch),
    comparePreReleases(a, b)
  );

const comparePreReleases = (a: Version, b: Version): Comparison => {
  if (a.preRelease === b.preRelease) {
    return Comparison.EQ;
  } else if (a.preRelease === undefined) {
    // a is a release, b is a prerelease - a > b
    return Comparison.GT;
  } else {
    // a is a prerelease, b is a release - a < b
    return Comparison.LT;
  }
};

export const enum VersionType {
  ReleaseReady = 'releaseReady',
  ReleaseCandidate = 'releaseCandidate'
}

const isValidPrerelease = (actual: string | undefined): boolean =>
  actual !== undefined && (actual === PreRelease.releaseCandidate || actual.startsWith(`${PreRelease.releaseCandidate}.`));

export const versionType = async (version: Version): Promise<VersionType> => {
  const sPre = showStringOrUndefined(version.preRelease);
  if (version.preRelease === undefined) {
    return VersionType.ReleaseReady;
  } else if (isValidPrerelease(version.preRelease)) {
    return VersionType.ReleaseCandidate;
  } else {
    const rc = PreRelease.releaseCandidate;
    return PromiseUtils.fail(`prerelease version part should be either "${rc}" or start with "${rc}." or not be set, but it is "${sPre}"`);
  }
};