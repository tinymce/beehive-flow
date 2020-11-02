import * as PromiseUtils from '../utils/PromiseUtils';
import * as ArrayUtils from '../utils/ArrayUtils';

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
    return PromiseUtils.fail('Could not parse version string');
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

export const compareMajorMinorVersions = (a: MajorMinorVersion, b: MajorMinorVersion): number =>
  a.major !== b.major ? a.major - b.major : a.minor - b.minor;

export const sortMajorMinorVersions = (vs: MajorMinorVersion[]): MajorMinorVersion[] =>
  ArrayUtils.sort(vs, compareMajorMinorVersions);
