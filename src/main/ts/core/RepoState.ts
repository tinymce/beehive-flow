import * as gitP from 'simple-git/promise';
import { CheckRepoActions } from 'simple-git';
import * as BranchLogic from '../core/BranchLogic';
import * as Git from '../utils/Git';
import * as Version from '../core/Version';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as HardCoded from '../args/HardCoded';
import { showStringOrUndefined, removeLeading } from '../utils/StringUtils';
import * as PackageJson from './PackageJson';
import * as Inspect from './Inspect';

type MajorMinorVersion = Version.MajorMinorVersion;
type Version = Version.Version;
type PackageJson = PackageJson.PackageJson;

export interface BaseRepoState {
  readonly gitUrl: string;
  readonly currentBranch: string;
  readonly version: Version;
  readonly majorMinorVersion: MajorMinorVersion;
  readonly packageJson: PackageJson;
  readonly packageJsonFile: string;
}

export interface Main extends BaseRepoState {
  readonly kind: 'Main';
}

export interface ReleaseCandidate extends BaseRepoState {
  readonly kind: 'ReleaseCandidate';
}

export interface Release extends BaseRepoState {
  readonly kind: 'Release';
}

export interface Feature extends BaseRepoState {
  readonly kind: 'Feature';
  readonly code: string;
}

export interface Hotfix extends BaseRepoState {
  readonly kind: 'Hotfix';
  readonly code: string;
}

export type RepoState = Main | ReleaseCandidate | Release | Feature | Hotfix;

export const detectRepoState = async (dir: string): Promise<RepoState> => {
  const fail = PromiseUtils.fail;
  const git = gitP(dir);

  // TODO: I'm expecting this to fail if we're not in a repo and at the root. Test this.
  await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);

  const currentBranch = await Git.currentBranch(git);

  const gitUrl = await Inspect.detectGitUrl(git);

  const packageJsonFile = PackageJson.pjInFolder(dir);
  const packageJson = await PackageJson.parsePackageJsonFile(packageJsonFile);

  const version = await PromiseUtils.optionToPromise(packageJson.version, 'Version missing in package.json file');
  const majorMinorVersion = Version.toMajorMinor(version);

  const baseRepoState: BaseRepoState = ({
    gitUrl,
    currentBranch,
    version,
    majorMinorVersion,
    packageJson,
    packageJsonFile
  });

  const loc = `${currentBranch} branch: package.json version`;
  const sPackageVersion = Version.versionToString(version);

  if (version.buildMetaData !== undefined) {
    return fail(`package.json version has an unexpected buildMetaData part`);
  } else {
    if (BranchLogic.isMainBranch(currentBranch)) {
      if (version.patch !== 0) {
        return fail(`${loc}: patch part should be 0, but is "${version.patch}"`);
      } else if (version.preRelease !== HardCoded.mainBranchPreReleaseVersion) {
        return fail(`${loc}: prerelease part should be "${HardCoded.mainBranchPreReleaseVersion}", but is ${showStringOrUndefined(version.preRelease)}`);
      } else {
        return {
          kind: 'Main',
          ...baseRepoState
        };
      }
    } else if (BranchLogic.isReleaseBranch(currentBranch)) {
      const branchVersion = await BranchLogic.versionFromReleaseBranch(currentBranch);

      const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

      if (version.major !== branchVersion.major || version.minor !== branchVersion.minor) {
        return fail(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
      } else if (version.preRelease === undefined) {
        return {
          kind: 'Release',
          ...baseRepoState
        };
      } else if (version.preRelease === HardCoded.releaseBranchReleaseCandidatePrereleaseVersion) {
        return {
          kind: 'ReleaseCandidate',
          ...baseRepoState
        };
      } else {
        const sPre = showStringOrUndefined(version.preRelease);
        return fail(`${loc}: prerelease version part should be either "${HardCoded.releaseBranchReleaseCandidatePrereleaseVersion}" or not set, but it is "${sPre}"`);
      }
    } else if (BranchLogic.isFeatureBranch(currentBranch)) {
      const code = removeLeading(currentBranch, 'feature/');

      if (version.patch !== 0) {
        return fail(`${loc}: patch part should be 0, but is "${version.patch}".`);
      } else if (version.preRelease !== HardCoded.mainBranchPreReleaseVersion) {
        return fail(`${loc}: prerelease part should be "${HardCoded.mainBranchPreReleaseVersion}", but is ${showStringOrUndefined(version.preRelease)}`);
      } else {
        return {
          kind: 'Feature',
          code,
          ...baseRepoState
        };
      }
    } else if (BranchLogic.isHotfixBranch(currentBranch)) {
      const code = removeLeading(currentBranch, 'hotfix/');
      if (version.preRelease !== HardCoded.releaseBranchReleaseCandidatePrereleaseVersion) {
        return fail(`${loc}: prerelease part should be "${HardCoded.releaseBranchReleaseCandidatePrereleaseVersion}"`);
      } else {
        return {
          kind: 'Hotfix',
          code,
          ...baseRepoState
        };
      }
    } else {
      return fail('Invalid branch name. beehive-flow is strict about branch names. Valid names: main, feature/*, hotfix/*, release/x.y');
    }
  }
};

export const expect = async (repoState: RepoState, kind: typeof repoState.kind): Promise<void> => {
  if (repoState.kind !== kind) {
    return PromiseUtils.fail(`Expected branch to be in ${kind} state, but was in ${repoState.kind} state`);
  }
};