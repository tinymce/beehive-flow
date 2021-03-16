import { StatusArgs } from '../args/BeehiveArgs';
import * as BranchLogic from '../core/BranchLogic';
import * as Version from '../core/Version';
import * as NpmTags from '../core/NpmTags';

type BranchState = BranchLogic.BranchState;
type BranchType = BranchLogic.BranchType;
type Version = Version.Version;

export interface Status {
  currentBranch: string;
  version: Version;
  versionString: string;
  branchType: BranchType;
  branchState: BranchState;
  isLatest: boolean;
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

  const { currentBranch, version, branchState, branchType, rootModule } = await BranchLogic.getBranchDetails(dir);

  const isLatest = await NpmTags.shouldTagLatestNpm(version, dir, rootModule.packageJson.name);

  return {
    currentBranch,
    version,
    versionString: Version.versionToString(version),
    branchType,
    branchState,
    isLatest
  };
};
