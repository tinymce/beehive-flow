import * as E from 'fp-ts/Either';
import * as EitherUtils from '../utils/EitherUtils';

type Either<R, A> = E.Either<R, A>;

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

export const releaseVersion = (major: number, minor: number, patch: number): Version => ({
  major, minor, patch
});

export const preReleaseVersion = (major: number, minor: number, patch: number, preRelease: string): Version => ({
  major, minor, patch, preRelease
});

// TODO: capture the "build metadata" in the semver spec
// TODO: maybe use the "semver" package instead
export const parseVersion = (input: string): Either<string, Version> => {
  // based on https://semver.org/
  // eslint-disable-next-line max-len
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const r = regexp.exec(input);

  if (r === null || r.groups === undefined) {
    return E.left('Could not parse version string');
  } else {
    const g = r.groups;
    // The regexp should guarantee that these are positive integers
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    const patch = parseInt(g.patch, 10);
    const preRelease = r.groups.prerelease;
    const buildMetaData = r.groups.buildMetaData;

    return E.right({
      major,
      minor,
      patch,
      preRelease,
      buildMetaData
    });
  }
};

export const parseMajorMinorVersion = (input: string): Either<string, MajorMinorVersion> => {
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)$/;
  const r = regexp.exec(input);
  if (r === null || r.groups === undefined) {
    return E.left('Could not parse major.minor version string');
  } else {
    const g = r.groups;
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    return E.right({ major, minor });
  }
};

export const parseMajorMinorVersionOrThrow = (s: string): MajorMinorVersion =>
  EitherUtils.getOrThrow(parseMajorMinorVersion(s));

export const isReleaseVersion = (v: Version): boolean =>
  v.preRelease === undefined && v.buildMetaData === undefined;

export const majorMinorVersionToString = (v: MajorMinorVersion): string =>
  `${v.major}.${v.minor}`;

// TODO: Test
export const versionToString = (v: Version): string => {
  const preBit = v.preRelease === undefined ? '' : '-' + v.preRelease;
  const metaBit = v.buildMetaData === undefined ? '' : '+' + v.buildMetaData;
  return [ v.major, v.minor, v.patch ].join('.') + preBit + metaBit;
};
