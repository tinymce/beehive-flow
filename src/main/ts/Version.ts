import { Either, left, right } from 'fp-ts/lib/Either';

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

export const releaseVersion = (major: number, minor: number, patch: number): ReleaseVersion => ({
  kind: 'ReleaseVersion',
  major, minor, patch
});

export const preReleaseVersion = (major: number, minor: number, patch: number, preRelease: string): PreReleaseVersion => ({
  kind: 'PreReleaseVersion',
  major, minor, patch, preRelease
});

// TODO: capture the "build metadata" in the semver spec
export const parseVersion = (input: string): Either<string, Version> => {
  // based on https://semver.org/
  const regexp = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const r = input.match(regexp);

  if (r === null || r.groups === undefined) {
    return left('Could not parse version string');
  } else {
    const g = r.groups;
    // The regexp should guarantee that these are positive integers
    const major = parseInt(g['major'], 10);
    const minor = parseInt(g['minor'], 10);
    const patch = parseInt(g['patch'], 10);
    const preRelease = r.groups['prerelease'];

    const v = preRelease === undefined
      ? releaseVersion(major, minor, patch)
      : preReleaseVersion(major, minor, patch, preRelease);
    return right(v);
  }
};

// TODO: Test
export const foldVersion = <T> (v: Version, ifRelease: (r: ReleaseVersion) => T, ifPreRelease: (r: PreReleaseVersion) => T): T => {
  if (v.kind === 'ReleaseVersion') {
    return ifRelease(v);
  } else if (v.kind === 'PreReleaseVersion') {
    return ifPreRelease(v);
  } else {
    throw new Error('Unknown version type');
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
