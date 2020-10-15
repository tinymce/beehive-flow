import * as E from 'fp-ts/Either';
import { eitherToPromiseVoid, eitherToPromise } from '../utils/PromiseUtils';
import { showStringOrUndefined, startsWith } from '../utils/StringUtils';
import * as Version from '../data/Version';
import { Either } from 'fp-ts/Either';
import * as HardCoded from '../args/HardCoded';

type Version = Version.Version;
type MajorMinorVersion = Version.MajorMinorVersion;

/**
 * @param v Version to check.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkMainBranchVersionE = (v: Version, source: string): Either<string, null> => {
  // must be a.b.0-main
  const loc = `main branch: ${source} version`;
  if (v.patch !== 0) {
    return E.left(`${loc}: patch part should be 0, but is "${v.patch}"`);
  } else if (v.preRelease !== HardCoded.mainBranchPreReleaseVersion) {
    return E.left(`${loc}: prerelease part should be "${HardCoded.mainBranchPreReleaseVersion}", but is ${showStringOrUndefined(v.preRelease)}`);
  } else if (v.buildMetaData !== undefined) {
    return E.left(`${loc}: buildMetaData part should not be set, but it is ${showStringOrUndefined(v.buildMetaData)}`);
  } else {
    return E.right(null);
  }
};

/**
 * @param v Version to check.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkMainBranchVersion = (v: Version, source: string): Promise<void> =>
  eitherToPromiseVoid(checkMainBranchVersionE(v, source));

/**
 * @param v Version to check.
 * @param branchVersion Version that comes from the branch name.
 * @param branchName Name of the branch. Should be consistent with branchVersion. Only used for error messages.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkReleaseBranchPreReleaseVersionE = (v: Version, branchVersion: MajorMinorVersion, branchName: string, source: string): Either<string, null> => {
  const sPackageVersion = Version.versionToString(v);
  const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

  const loc = `${branchName} branch: ${source} version`;

  if (v.preRelease !== HardCoded.releaseBranchPreReleaseVersion) {
    const sPre = showStringOrUndefined(v.preRelease);
    return E.left(`${loc}: prerelease version part should be "${HardCoded.releaseBranchPreReleaseVersion}", but it is "${sPre}"`);
  } else if (v.buildMetaData !== undefined) {
    return E.left(`${loc}: buildMetaData version part should not be set, but it is ${showStringOrUndefined(v.buildMetaData)}`);
  } else if (v.major != branchVersion.major || v.minor !== branchVersion.minor) {
    return E.left(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
  } else {
    return E.right(null);
  }
};


/**
 * Checks that the version is correct for a release branch in "prerelease" state.
 * @param v Version to check.
 * @param branchVersion Version that comes from the branch name.
 * @param branchName Name of the branch. Should be consistent with branchVersion. Only used for error messages.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkReleaseBranchPreReleaseVersion = (v: Version, branchVersion: MajorMinorVersion, branchName: string, source: string): Promise<void> =>
  eitherToPromiseVoid(checkReleaseBranchPreReleaseVersionE(v, branchVersion, branchName, source));

/**
 * Checks that the version is correct for a release branch in "release" state.
 *
 * @param v Version to check.
 * @param branchVersion Version that comes from the branch name.
 * @param branchName Name of the branch. Should be consistent with branchVersion. Only used for error messages.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkReleaseBranchReleaseVersionE = (v: Version, branchVersion: MajorMinorVersion, branchName: string, source: string): Either<string, null> => {
  const sPackageVersion = Version.versionToString(v);
  const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

  const loc = `${branchName} branch: ${source} version`;

  if (v.preRelease !== undefined) {
    const sPre = showStringOrUndefined(v.preRelease);
    return E.left(`${loc}: prerelease version part should not be set, but it is "${sPre}"`);
  } else if (v.buildMetaData !== undefined) {
    return E.left(`${loc}: buildMetaData version part should not be set, but it is ${showStringOrUndefined(v.buildMetaData)}`);
  } else if (v.major != branchVersion.major || v.minor !== branchVersion.minor) {
    return E.left(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
  } else {
    return E.right(null);
  }
};

/**
 * Checks that the version is correct for a release branch in "release" state.
 *
 * @param v Version to check.
 * @param branchVersion Version that comes from the branch name.
 * @param branchName Name of the branch. Should be consistent with branchVersion. Only used for error messages.
 * @param source File that the version came from, e.g. package.json. Only used for error messages.
 */
export const checkReleaseBranchReleaseVersion = (v: Version, branchVersion: MajorMinorVersion, branchName: string, source: string): Promise<void> =>
  eitherToPromiseVoid(checkReleaseBranchReleaseVersionE(v, branchVersion, branchName, source));

// TODO: Test
export const releaseBranchName = (v: MajorMinorVersion): string =>
  `release/${v.major}.${v.minor}`;

export const versionFromReleaseBranchE = (branchName: string): Either<string, MajorMinorVersion> => {
  const regexp = /^\/release\/(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)$/;
  const r = regexp.exec(branchName);
  if (r === null || r.groups === undefined) {
    return E.left('Could not parse major.minor version from branch name');
  } else {
    const g = r.groups;
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    return E.right({ major, minor });
  }
};

export const versionFromReleaseBranch = (branchName: string): Promise<MajorMinorVersion> =>
  eitherToPromise(versionFromReleaseBranchE(branchName));

export const isFeatureBranch = (branchName: string): boolean =>
  startsWith(branchName, 'feature/');
