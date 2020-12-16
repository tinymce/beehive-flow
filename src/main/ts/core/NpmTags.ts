import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as ArrayUtils from '../utils/ArrayUtils';
import { BranchState, getReleaseBranchName, versionFromReleaseBranch } from './BranchLogic';
import * as Version from './Version';

export const pickTags = async (branchName: string, branchState: BranchState, getBranches: () => Promise<string[]>): Promise<[string, string?]> => {
  const mainTag = branchName.replace(/\//g, '-');

  if (branchState !== BranchState.ReleaseReady) {
    return [ mainTag ];
  }

  const branches = await getBranches();
  const versions = await PromiseUtils.filterMap(branches, versionFromReleaseBranch);
  const greatestOpt = ArrayUtils.greatest(versions, Version.compareMajorMinorVersions);
  const greatest = await PromiseUtils.optionToPromise(greatestOpt, 'Could not find any release branches with valid names.');
  const releaseBranchName = getReleaseBranchName(greatest);
  return branchName === releaseBranchName ? [ mainTag, 'latest' ] : [ mainTag ];
};

export const pickTagsGit = async (branchName: string, branchState: BranchState, git: SimpleGit): Promise<[string, string?]> =>
  pickTags(branchName, branchState, () => Git.remoteBranchNames(git));
