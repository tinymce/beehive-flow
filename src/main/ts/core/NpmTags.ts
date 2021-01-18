import { SimpleGit } from 'simple-git/promise';
import * as Git from '../utils/Git';
import * as PreRelease from '../core/PreRelease';
import { BranchState, isLatestReleaseBranch } from './BranchLogic';
import { majorMinorVersionToString, Version } from './Version';

export const pickTags = async (
  branchName: string, branchState: BranchState, version: Version, getBranches: () => Promise<string[]>
): Promise<[string, ...string[]]> => {

  const branchTag = branchName.replace(/[^\w.]+/g, '-');

  const vs = majorMinorVersionToString(version);

  const rcTagName = () => `${PreRelease.releaseCandidate}-${vs}`;

  // Note: we tag releases as release-x.y. This seems unnecessary, as you can use package@x.y to refer to it.
  // However, we need to pick at least one tag for each build, otherwise npm publish will tag builds as 'latest'.
  // Adding this tag covers a few scenarios where we don't otherwise have a tag to add.

  if (branchName === 'main') {
    if (branchState === BranchState.ReleaseCandidate) {
      return [ branchTag, rcTagName() ];

    } else if (branchState === BranchState.ReleaseReady) {
      // assume main is always latest minor version
      return [ branchTag, 'latest', `release-${vs}` ];
    }

  } else {
    if (branchState === BranchState.ReleaseCandidate) {
      // tagging a prerelease as release-x.y would be confusing
      return [ rcTagName() ];

    } else if (branchState === BranchState.ReleaseReady) {
      const isLatest = await isLatestReleaseBranch(branchName, await getBranches());
      return isLatest ? [ branchTag, 'latest' ] : [ branchTag ];
    }
  }
  return [ branchTag ];
};

export const pickTagsGit = async (branchName: string, branchState: BranchState, version: Version, git: SimpleGit): Promise<[string, ...string[]]> =>
  pickTags(branchName, branchState, version, () => Git.remoteBranchNames(git));
