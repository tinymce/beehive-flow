import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as ArrayUtils from '../utils/ArrayUtils';
import * as BranchLogic from './BranchLogic';
import * as Version from './Version';

const BranchState = BranchLogic.BranchState;

type BranchState = BranchLogic.BranchState;

export const pickTags = async (branchName: string, branchState: BranchState, getBranches: () => Promise<string[]>): Promise<string[]> => {
  // ASSUMPTION: all valid git branch names are valid npm tags
  const mainTag = branchName;

  const tagsForReleaseReadyState = async (): Promise<string[]> => {
    const branches = await getBranches();
    const versions = await PromiseUtils.filterMap(branches, BranchLogic.versionFromReleaseBranch);
    const og = ArrayUtils.greatest(versions, Version.compareMajorMinorVersions);
    const g = await PromiseUtils.optionToPromise(og, 'Could not find any release branches with valid names.');
    const bn = BranchLogic.getReleaseBranchName(g);
    return branchName === bn ? [ mainTag, 'latest' ] : [ mainTag ];
  };

  return branchState === BranchState.ReleaseReady ? await tagsForReleaseReadyState() : [ mainTag ];
};

export const pickTagsGit = async (branchName: string, branchState: BranchState, git: SimpleGit): Promise<string[]> =>
  pickTags(branchName, branchState, () => Git.remoteBranchNames(git));
