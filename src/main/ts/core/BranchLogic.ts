import * as O from 'fp-ts/Option';
import * as gitP from 'simple-git/promise';
import { CheckRepoActions } from 'simple-git';
import * as PromiseUtils from '../utils/PromiseUtils';
import { showStringOrUndefined } from '../utils/StringUtils';
import * as Git from '../utils/Git';
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
export enum BranchType {
  Main, Feature, Hotfix, Spike, Release
}

// eslint-disable-next-line no-shadow
export enum BranchState {
  Main, Feature, Hotfix, Spike, ReleaseReady, ReleaseCandidate
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
    if (parts.length === 0) {
      return O.none;
    } else {
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
  }
};

export const inspectRepo = async (dir: string): Promise<BranchDetails> => {
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

  const validateMainBranch = async (): Promise<BranchState.Main> => {
    if (version.patch !== 0) {
      return fail(`${loc}: patch part should be 0, but is "${version.patch}"`);
    } else if (version.preRelease !== PreRelease.mainBranch) {
      return fail(`${loc}: prerelease part should be "${PreRelease.mainBranch}", but is ${sPre}`);
    } else {
      return BranchState.Main;
    }
  };

  const validateReleaseBranch = async (): Promise<BranchState.ReleaseCandidate | BranchState.ReleaseReady> => {
    const branchVersion = await versionFromReleaseBranch(currentBranch);
    const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

    if (version.major !== branchVersion.major || version.minor !== branchVersion.minor) {
      return fail(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
    } else if (version.preRelease === undefined) {
      return BranchState.ReleaseReady;
    } else if (version.preRelease === PreRelease.releaseCandidate) {
      return BranchState.ReleaseCandidate;
    } else {
      return fail(`${loc}: prerelease version part should be either "${PreRelease.releaseCandidate}" or not set, but it is "${sPre}"`);
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
