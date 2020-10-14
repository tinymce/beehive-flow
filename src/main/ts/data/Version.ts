import { Either, left, right } from 'fp-ts/Either';
import { impossible } from '../utils/Impossible';

export interface ReleaseVersion {
  readonly kind: 'ReleaseVersion';
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface PreReleaseVersion {
  readonly kind: 'PreReleaseVersion';
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly preRelease: string;
}

export type Version = ReleaseVersion | PreReleaseVersion;

export interface MajorMinorVersion {
  readonly major: number;
  readonly minor: number;
}

export const releaseVersion = (major: number, minor: number, patch: number): ReleaseVersion => ({
  kind: 'ReleaseVersion',
  major, minor, patch
});

export const preReleaseVersion = (major: number, minor: number, patch: number, preRelease: string): PreReleaseVersion => ({
  kind: 'PreReleaseVersion',
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
    return left('Could not parse version string');
  } else {
    const g = r.groups;
    // The regexp should guarantee that these are positive integers
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    const patch = parseInt(g.patch, 10);
    const preRelease = r.groups.prerelease;

    const v = preRelease === undefined
      ? releaseVersion(major, minor, patch)
      : preReleaseVersion(major, minor, patch, preRelease);
    return right(v);
  }
};


// TODO: Test
export const foldVersion = <T> (v: Version, ifRelease: (r: ReleaseVersion) => T, ifPreRelease: (r: PreReleaseVersion) => T): T => {
  switch (v.kind) {
    case 'ReleaseVersion':
      return ifRelease(v);
    case 'PreReleaseVersion':
      return ifPreRelease(v);
    default:
      return impossible(v);
  }
};

// TODO: Test
export const versionToString = (v: Version): string =>
  foldVersion(
    v,
    (r) => [ r.major, r.minor, r.patch ].join('.'),
    (r) => [ r.major, r.minor, r.patch ].join('.') + '-' + r.preRelease
  );

// TODO: Test
export const releaseBranchName = (v: Version): string =>
  `release/${v.major}.${v.minor}`;
