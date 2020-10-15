import { BeehiveArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import { SimpleGit } from 'simple-git';
import * as PackageJson from '../data/PackageJson';
import * as Version from '../data/Version';
import { optionToPromise } from '../utils/PromiseUtils';
import * as HardCoded from '../args/HardCoded';

// This module contains high-level operations used by the commands. Unlike those in utils, these are allowed to log console messages.

type Version = Version.Version;
type PackageJson = PackageJson.PackageJson;

const dryRunMessage = async (dir: string, git: SimpleGit): Promise<string> => {
  const curBranch = await Git.currentBranch(git);
  return `dry-run - not pushing. To complete, push "${curBranch}" branch from ${dir}`;
};

export const gitPushNewBranchUnlessDryRun = async (fc: BeehiveArgs, dir: string, git: SimpleGit): Promise<void> => {
  if (fc.dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await Git.pushNewBranch(git);
  }
};

export const gitPushUnlessDryRun = async (args: BeehiveArgs, dir: string, git: SimpleGit) => {
  if (args.dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await Git.push(git);
  }
};

export const readPackageJsonFileInDirAndRequireVersion = async (dir: string): Promise<{ pjFile: string; pj: PackageJson; version: Version }> => {
  console.log(`Parsing package.json file in dir: ${dir}`);
  const pjFile = PackageJson.pjInFolder(dir);
  const pj = await PackageJson.parsePackageJsonFile(pjFile);

  const version = await optionToPromise(pj.version, 'Version missing in package.json file');
  console.log(`package.json has version: ${Version.versionToString(version)}`);
  return { pjFile, pj, version };
};

export const branchShouldNotExist = async (git: SimpleGit, branchName: string): Promise<void> => {
  if (await Git.doesRemoteBranchExist(git, branchName)) {
    throw new Error(`Remote branch already exists: ${branchName}`);
  }
};

export const checkoutMainBranch = (git: SimpleGit): Promise<string> =>
  gitCheckout(git, HardCoded.mainBranch);


export const gitCheckout = async (git: SimpleGit, branchName: string): Promise<string> => {
  console.log(`Checking out branch: ${branchName}`);
  await git.checkout(branchName);
  return branchName;
};
