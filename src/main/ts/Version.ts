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
  readonly preid: string;
}

export type Version = ReleaseVersion | PreReleaseVersion;

export const releaseVersion = (major: number, minor: number, patch: number): ReleaseVersion => ({
  kind: 'ReleaseVersion',
  major, minor, patch
});

export const preReleaseVersion = (major: number, minor: number, patch: number, preid: string): PreReleaseVersion => ({
  kind: 'PreReleaseVersion',
  major, minor, patch, preid
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
    const major = Number(g['major']);
    const minor = Number(g['minor']);
    const patch = Number(g['patch']);
    const preid = r.groups['prerelease'];

    const v = preid === undefined
      ? releaseVersion(major, minor, patch)
      : preReleaseVersion(major, minor, patch, preid);
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
export const showVersion = (v: Version): string =>
  foldVersion(
    v,
    (r) => [ r.major, r.minor, r.patch ].join('.'),
    (r) => [ r.major, r.minor, r.patch ].join('.') + '-' + r.preid
  );

// TODO: Test
export const releaseBranchName = (v: Version): string =>
  `release/${v.major}.${v.minor}`;
