import * as gitP from 'simple-git/promise';
import { StatusArgs } from '../args/BeehiveArgs';
import * as BranchLogic from '../core/BranchLogic';
import * as Git from '../utils/Git';
import * as Version from '../core/Version';

type BranchState = BranchLogic.BranchState;
type BranchType = BranchLogic.BranchType;
type Version = Version.Version;

export interface Status {
  branchState: BranchState;
  isLatestReleaseBranch: boolean;
  currentBranch: string;
  branchType: BranchType;
  version: Version;
  versionString: string;
}

export const status = async (args: StatusArgs): Promise<void> => {
  const sInfo = await getStatusJson(args);
  console.log(sInfo);
};

export const getStatusJson = async (args: StatusArgs): Promise<string> => {
  const info = await getStatus(args);
  return JSON.stringify(info, undefined, 2);
};

export const getStatus = async (args: StatusArgs): Promise<Status> => {
  const dir = args.workingDir;
  const git = gitP(dir);

  const { currentBranch, version, branchState, branchType } = await BranchLogic.getBranchDetails(dir);
  const branchNames = await Git.remoteBranchNames(git);

  const isLatestReleaseBranch = await BranchLogic.isLatestReleaseBranch(currentBranch, branchNames);

  return {
    currentBranch,
    version,
    versionString: Version.versionToString(version),
    branchState,
    branchType,
    isLatestReleaseBranch
  };
};
