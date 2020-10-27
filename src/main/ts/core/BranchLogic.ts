import * as E from 'fp-ts/Either';
import { eitherToPromise } from '../utils/PromiseUtils';
import { startsWith } from '../utils/StringUtils';
import * as HardCoded from '../args/HardCoded';
import * as Version from './Version';

type MajorMinorVersion = Version.MajorMinorVersion;
type Either<R, A> = E.Either<R, A>;

// TODO: Test
export const releaseBranchName = (v: MajorMinorVersion): string =>
  `release/${v.major}.${v.minor}`;

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
  eitherToPromise(versionFromReleaseBranchE(branchName));

export const isFeatureBranch = (branchName: string): boolean =>
  startsWith(branchName, 'feature/');

export const isHotfixBranch = (branchName: string): boolean =>
  startsWith(branchName, 'hotfix/');

export const isReleaseBranch = (branchName: string): boolean =>
  E.isRight(versionFromReleaseBranchE(branchName));

export const isMainBranch = (branchName: string): boolean =>
  branchName === HardCoded.mainBranch;