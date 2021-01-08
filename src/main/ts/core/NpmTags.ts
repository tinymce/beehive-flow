import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import { BranchState, isLatestReleaseBranch } from './BranchLogic';
import { majorMinorVersionToString, Version } from './Version';

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
