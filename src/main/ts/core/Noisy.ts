import { SimpleGit } from 'simple-git';
import * as O from 'fp-ts/Option';
import * as gitP from 'simple-git/promise';
import { BeehiveArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import { optionToPromise } from '../utils/PromiseUtils';
import * as HardCoded from '../args/HardCoded';
import * as PackageJson from './PackageJson';
import * as Version from './Version';

// This module contains high-level operations used by the commands. Unlike those in utils, these are allowed to log console messages.

type Version = Version.Version;
type PackageJson = PackageJson.PackageJson;
type Option<A> = O.Option<A>;

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

export const gitPushUnlessDryRun = async (args: BeehiveArgs, dir: string, git: SimpleGit): Promise<void> => {
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

export const writePackageJsonFileWithNewVersion = async (pj: PackageJson, newVersion: Version, pjFile: string): Promise<PackageJson> => {
  console.log(`Setting version in ${pjFile} to: ${Version.versionToString(newVersion)}`);
  const newPj = PackageJson.setVersion(pj, O.some(newVersion));
  await PackageJson.writePackageJsonFile(pjFile, newPj);
  return newPj;
};

export const resolveGitUrl = async (configGitUrl: Option<string>): Promise<string> => {
  if (configGitUrl._tag === 'Some') {
    return configGitUrl.value;
  } else {
    const g = gitP(process.cwd());
    const remotes = await g.getRemotes(true);
    if (remotes.length === 1) {
      return remotes[0].refs.fetch;
    } else if (remotes.length === 0) {
      throw new Error('Could not detect git url - the repo has no remotes.');
    } else {
      const res = remotes.find((r) => r.name === 'origin');
      if (res !== undefined) {
        return res.refs.fetch;
      } else {
        throw new Error('Could not detect git url - there were multiple remotes and none were called "origin"');
      }
    }
  }
};