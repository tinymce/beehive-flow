import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as ArrayUtils from '../utils/ArrayUtils';
import { BranchState, getReleaseBranchName, versionFromReleaseBranch } from './BranchLogic';
import { compareMajorMinorVersions, majorMinorVersionToString, Version } from './Version';

const isLatestReleaseBranch = async (getBranches: () => Promise<string[]>, branchName: string): Promise<boolean> => {
  const branches = await getBranches();
  const versions = await PromiseUtils.filterMap(branches, versionFromReleaseBranch);
  const greatestOpt = ArrayUtils.greatest(versions, compareMajorMinorVersions);
  const greatest = await PromiseUtils.optionToPromise(greatestOpt, 'Could not find any release branches with valid names.');
  const releaseBranchName = getReleaseBranchName(greatest);
  return branchName === releaseBranchName;
};

export const pickTags = async (branchName: string, branchState: BranchState, version: Version, getBranches: () => Promise<string[]>): Promise<string[]> => {

  const mainTag = branchName.replace(/[^\w.]+/g, '-');

  if (branchState === BranchState.releaseCandidate) {
    const vs = majorMinorVersionToString(version);
    return [ `rc-${vs}` ];

  } else if (branchState === BranchState.releaseReady) {
    const isLatest = await isLatestReleaseBranch(getBranches, branchName);
    return isLatest ? [ mainTag, 'latest' ] : [ mainTag ];

  } else {
    return [ mainTag ];
  }
};

export const pickTagsGit = async (branchName: string, branchState: BranchState, version: Version, git: SimpleGit): Promise<string[]> =>
  pickTags(branchName, branchState, version, () => Git.remoteBranchNames(git));
