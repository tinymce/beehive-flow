import * as E from 'fp-ts/Either';
import * as gitP from 'simple-git/promise';
import { CheckRepoActions } from 'simple-git';
import * as PromiseUtils from '../utils/PromiseUtils';
import { removeLeading, showStringOrUndefined, startsWith } from '../utils/StringUtils';
import * as Git from '../utils/Git';
import * as Version from './Version';
import * as PreRelease from './PreRelease';
import { BaseRepoState, RepoState } from './RepoState';
import * as PackageJson from './PackageJson';

type MajorMinorVersion = Version.MajorMinorVersion;
type Either<R, A> = E.Either<R, A>;

export const releaseBranchName = ({ major, minor }: MajorMinorVersion): string =>
  `release/${major}.${minor}`;

export const versionFromReleaseBranchE = (branchName: string): Either<string, MajorMinorVersion> => {
  const regexp = /^release\/(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)$/;
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
  PromiseUtils.eitherToPromise(versionFromReleaseBranchE(branchName));

export const isFeatureBranch = (branchName: string): boolean =>
  startsWith(branchName, 'feature/');

export const isHotfixBranch = (branchName: string): boolean =>
  startsWith(branchName, 'hotfix/');

export const isSpikeBranch = (branchName: string): boolean =>
  startsWith(branchName, 'spike/');

export const isReleaseBranch = (branchName: string): boolean =>
  E.isRight(versionFromReleaseBranchE(branchName));

export const mainBranchName = 'main';

export const isMainBranch = (branchName: string): boolean =>
  branchName === mainBranchName;

export const detectRepoState = async (dir: string): Promise<RepoState> => {
  const fail = PromiseUtils.fail;
  const git = gitP(dir);

  await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);

  const currentBranch = await Git.currentBranch(git);

  const gitUrl = await Git.detectGitUrl(git);

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
  } else if (isMainBranch(currentBranch)) {
    if (version.patch !== 0) {
      return fail(`${loc}: patch part should be 0, but is "${version.patch}"`);
    } else if (version.preRelease !== PreRelease.mainBranch) {
      return fail(`${loc}: prerelease part should be "${PreRelease.mainBranch}", but is ${showStringOrUndefined(version.preRelease)}`);
    } else {
      return {
        kind: 'Main',
        ...baseRepoState
      };
    }
  } else if (isReleaseBranch(currentBranch)) {
    const branchVersion = await versionFromReleaseBranch(currentBranch);

    const sBranchVersion = Version.majorMinorVersionToString(branchVersion);

    if (version.major !== branchVersion.major || version.minor !== branchVersion.minor) {
      return fail(`${loc}: major.minor of branch (${sBranchVersion}) is not consistent with package version (${sPackageVersion})`);
    } else if (version.preRelease === undefined) {
      return {
        kind: 'Release',
        ...baseRepoState
      };
    } else if (version.preRelease === PreRelease.releaseCandidate) {
      return {
        kind: 'ReleaseCandidate',
        ...baseRepoState
      };
    } else {
      const sPre = showStringOrUndefined(version.preRelease);
      return fail(`${loc}: prerelease version part should be either "${PreRelease.releaseCandidate}" or not set, but it is "${sPre}"`);
    }
  } else if (isFeatureBranch(currentBranch)) {
    const code = removeLeading(currentBranch, 'feature/');
    return {
      kind: 'Feature',
      code,
      ...baseRepoState
    };

  } else if (isHotfixBranch(currentBranch)) {
    const code = removeLeading(currentBranch, 'hotfix/');
    return {
      kind: 'Hotfix',
      code,
      ...baseRepoState
    };

  } else if (isSpikeBranch(currentBranch)) {
    const code = removeLeading(currentBranch, 'hotfix/');
    return {
      kind: 'Spike',
      code,
      ...baseRepoState
    };
  } else {
    return fail('Invalid branch name. beehive-flow is strict about branch names. Valid names: main, feature/*, hotfix/*, spike/*, release/x.y');
  }
};
