import * as gitP from 'simple-git/promise';
import { SimpleGit } from 'simple-git';
import { AdvanceArgs, AdvanceCiArgs, BeehiveArgs } from '../args/BeehiveArgs';
import { Version } from '../core/Version';
import * as Git from '../utils/Git';
import { BranchState, getBranchDetails, Module } from '../core/BranchLogic';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as AdvanceVersion from '../core/AdvanceVersion';
import { printHeaderMessage } from '../core/Messages';

const go = async (version: Version, module: Module, git: SimpleGit, args: BeehiveArgs, dir: string): Promise<void> => {
  await AdvanceVersion.advancePatch(version, module.packageJson, module.packageJsonFile, git);
  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};

export const advance = async (args: AdvanceArgs): Promise<void> => {
  printHeaderMessage(args);
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  await Git.checkout(git, args.branchName);

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseReady) {
    return PromiseUtils.fail('Branch is not in release ready state - can\'t advance. Check that the version is x.y.z with no suffix.');
  }
  await go(branchDetails.version, branchDetails.rootModule, git, args, dir);
};

export const advanceCi = async (args: AdvanceCiArgs): Promise<void> => {
  printHeaderMessage(args);
  const dir = args.workingDir;

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseReady) {
    console.log('Not in release ready state - not advancing version.');
  } else {
    const git = gitP(dir);
    await go(branchDetails.version, branchDetails.rootModule, git, args, dir);
  }
};
