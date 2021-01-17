import * as O from 'fp-ts/Option';
import * as gitP from 'simple-git/promise';
import { CheckRepoActions } from 'simple-git';
import { pipe } from 'fp-ts/pipeable';
import * as PromiseUtils from '../utils/PromiseUtils';
import { showStringOrUndefined } from '../utils/StringUtils';
import * as Git from '../utils/Git';
import * as ArrayUtils from '../utils/ArrayUtils';
import * as Version from './Version';
import * as PreRelease from './PreRelease';
import * as PackageJson from './PackageJson';

type MajorMinorVersion = Version.MajorMinorVersion;
type Version = Version.Version;
type Option<A> = O.Option<A>;
type PackageJson = PackageJson.PackageJson;

export const getReleaseBranchName = ({ major, minor }: MajorMinorVersion): string =>
  `release/${major}.${minor}`;

// eslint-disable-next-line no-shadow
export const enum BranchType {
  Main = 'main',
  Feature = 'feature',
  Hotfix = 'hotfix',
  Spike = 'spike',
  Release = 'release'
}

// eslint-disable-next-line no-shadow
export const enum BranchState {
  Feature = 'feature',
  Hotfix = 'hotfix',
  Spike = 'spike',
  ReleaseReady = 'releaseReady',
  ReleaseCandidate = 'releaseCandidate'
}

export interface BranchDetails {
  readonly currentBranch: string;
  readonly version: Version;
  readonly packageJson: PackageJson;
  readonly packageJsonFile: string;
  readonly branchType: BranchType;
  readonly branchState: BranchState;
}

export const versionFromReleaseBranch = async (branchName: string): Promise<MajorMinorVersion> => {
  const regexp = /^release\/(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)$/;
  const r = regexp.exec(branchName);
  if (r === null || r.groups === undefined) {
    return PromiseUtils.fail('Could not parse major.minor version from branch name');
  } else {
    const g = r.groups;
    const major = parseInt(g.major, 10);
    const minor = parseInt(g.minor, 10);
    return { major, minor };
  }
};

export const mainBranchName = 'main';

export const getBranchType = (branchName: string): Option<BranchType> => {
  if (branchName === mainBranchName) {
    return O.some(BranchType.Main);
  } else {
    const parts = branchName.split('/');
    switch (parts[0]) {
      case 'feature':
        return O.some(BranchType.Feature);
      case 'hotfix':
        return O.some(BranchType.Hotfix);
      case 'spike':
        return O.some(BranchType.Spike);
      case 'release':
        return O.some(BranchType.Release);
      default:
        return O.none;
    }
  }
};

export const isValidPrerelease = (actual: string | undefined, expected: string): boolean =>
  actual !== undefined && (actual === expected || actual.startsWith(`${expected}.`));

export const getBranchDetails = async (dir: string): Promise<BranchDetails> => {
  const fail = PromiseUtils.fail;
  const git = gitP(dir);

  await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);

  const currentBranch = await Git.currentBranch(git);

  const packageJsonFile = PackageJson.pjInFolder(dir);
  const packageJson = await PackageJson.parsePackageJsonFile(packageJsonFile);

  const version = await PromiseUtils.optionToPromise(packageJson.version, 'Version missing in package.json file');

  const baseState = {
    currentBranch,
    version,
    packageJson,
    packageJsonFile
  };

  const loc = `${currentBranch} branch: package.json version`;
  const sPackageVersion = Version.versionToString(version);
  const sPre = showStringOrUndefined(version.preRelease);

  const rcOrReleaseReady = async (): Promise<BranchState.ReleaseCandidate | BranchState.ReleaseReady> => {
    if (version.preRelease === undefined) {
      return BranchState.ReleaseReady;
    } else if (isValidPrerelease(version.preRelease, PreRelease.releaseCandidate)) {
      return BranchState.ReleaseCandidate;
    } else {
      const rc = PreRelease.releaseCandidate;
      return fail(`${loc}: prerelease version part should be either "${rc}" or start with "${rc}." or not be set, but it is "${sPre}"`);
    }
  };

  const validateMainBranch = rcOrReleaseReady;

  const validateReleaseBranch = async (): Promise<BranchState.ReleaseCandidate | BranchState.ReleaseReady> => {
    const branchVersion = await versionFromReleaseBranch(currentBranch);
    const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

    if (version.major !== branchVersion.major || version.minor !== branchVersion.minor) {
      return fail(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
    } else {
      return rcOrReleaseReady();
    }
  };

  const detect = async (branchType: BranchType): Promise<BranchState> => {
    switch (branchType) {
      case BranchType.Main:
        return validateMainBranch();
      case BranchType.Feature:
        return BranchState.Feature;
      case BranchType.Hotfix:
        return BranchState.Hotfix;
      case BranchType.Spike:
        return BranchState.Spike;
      case BranchType.Release:
        return validateReleaseBranch();
    }
  };

  if (version.buildMetaData !== undefined) {
    return fail(`package.json version has an unexpected buildMetaData part`);
  } else {
    const obt = getBranchType(currentBranch);
    if (obt._tag === 'None') {
      return fail('Invalid branch name. beehive-flow is strict about branch names. Valid names: main, feature/*, hotfix/*, spike/*, release/x.y');
    } else {
      const branchType = obt.value;
      const branchState = await detect(branchType);
      return {
        ...baseState,
        branchState,
        branchType
      };
    }
  }
};

export const isLatestReleaseBranch = async (branchName: string, branches: string[]): Promise<boolean> => {
  const versions = await PromiseUtils.filterMap(branches, versionFromReleaseBranch);
  return pipe(
    ArrayUtils.greatest(versions, Version.compareMajorMinorVersions),
    O.map(getReleaseBranchName),
    O.exists((greatest) => branchName === greatest)
  );
};
