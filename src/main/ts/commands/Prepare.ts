import { SimpleGit } from 'simple-git';
import * as Git from '../utils/Git';
import { BranchState, BranchDetails, getBranchDetails, getReleaseBranchName, createReleaseBranch } from '../core/BranchLogic';
import { PrepareArgs } from '../args/BeehiveArgs';
import * as AdvanceVersion from '../core/AdvanceVersion';
import * as PromiseUtils from '../utils/PromiseUtils';
import { printHeaderMessage } from '../core/Messages';

const updateMainBranch = async (mainBranch: string, git: SimpleGit, branchDetails: BranchDetails): Promise<void> => {
  console.log(`Updating ${mainBranch} branch`);
  await git.checkout(mainBranch);
  const rootModule = branchDetails.rootModule;
  await AdvanceVersion.advanceMinor(branchDetails.version, rootModule.packageJson, rootModule.packageJsonFile, git);
};

export const prepare = async (args: PrepareArgs): Promise<void> => {
  printHeaderMessage(args);
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  const mainBranch = await Git.checkoutMainBranch(git);

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseCandidate) {
    return PromiseUtils.fail('main branch should have an rc version when running this command');
  }

  const releaseBranchName = getReleaseBranchName(branchDetails.version);

  await Git.branchShouldNotExist(git, releaseBranchName);

  // Create the release branch
  await createReleaseBranch(releaseBranchName, git, dir);
  await Git.pushUnlessDryRun(dir, git, args.dryRun);

  // Update the main branch
  await updateMainBranch(mainBranch, git, branchDetails);
  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};
