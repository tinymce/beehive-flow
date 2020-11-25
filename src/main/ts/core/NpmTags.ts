import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as ArrayUtils from '../utils/ArrayUtils';
import { BranchState, versionFromReleaseBranch, getReleaseBranchName } from './BranchLogic';
import * as Version from './Version';

export const pickTags = async (branchName: string, branchState: BranchState, getBranches: () => Promise<string[]>): Promise<[string, string?]> => {
  // ASSUMPTION: all valid git branch names are valid npm tags
  const mainTag = branchName;

  const tagsForReleaseReadyState = async (): Promise<[string, string?]> => {
    const branches = await getBranches();
    const versions = await PromiseUtils.filterMap(branches, versionFromReleaseBranch);
    const og = ArrayUtils.greatest(versions, Version.compareMajorMinorVersions);
    const g = await PromiseUtils.optionToPromise(og, 'Could not find any release branches with valid names.');
    const bn = getReleaseBranchName(g);
    return branchName === bn ? [ mainTag, 'latest' ] : [ mainTag ];
  };

  return branchState === BranchState.ReleaseReady ? await tagsForReleaseReadyState() : [ mainTag ];
};

export const pickTagsGit = async (branchName: string, branchState: BranchState, git: SimpleGit): Promise<[string, string?]> =>
  pickTags(branchName, branchState, () => Git.remoteBranchNames(git));
