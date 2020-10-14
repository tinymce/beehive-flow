import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as Git from '../utils/Git';
import * as Hardcoded from '../args/Hardcoded';
import * as PackageJson from '../data/PackageJson';
import * as BranchRules from '../logic/BranchRules';
import * as Files from '../utils/Files';
import { optionToPromise } from '../utils/PromiseUtils';
import { PrepareArgs } from '../args/BeehiveArgs';
import { SimpleGit } from 'simple-git';
import * as Version from '../data/Version';
import * as O from 'fp-ts/Option';

type PackageJson = PackageJson.PackageJson;
type Version = Version.Version;

// TODO: Pass in git repo / git url? Use current checkout?

export const prepare = (fc: PrepareArgs): Promise<void> =>
  runPrepare(fc, Hardcoded.testGitUrl);

const writeBuildPropertiesFile = async (dir: string, releaseBranchName: string): Promise<string> => {
  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    console.log(`${buildPropertiesFile} does not exist: creating`);
    await Files.writeFile(buildPropertiesFile, '');
  }

  console.log(`Updating properties file: ${buildPropertiesFile}`);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);
  return buildPropertiesFile;
};

export const newMainBranchVersion = (oldMainBranchVersion: Version): Version => ({
  major: oldMainBranchVersion.major,
  minor: oldMainBranchVersion.minor + 1,
  patch: 0,
  preRelease: 'main'
});

export const releaseBranchVersion = (oldMainBranchVersion: Version): Version => ({
  major: oldMainBranchVersion.major,
  minor: oldMainBranchVersion.minor,
  patch: 0,
  preRelease: 'rc'
});

const dryRunMessage = async (dir: string, git: SimpleGit): Promise<string> => {
  const curBranch = await Git.currentBranch(git);
  return `dry-run - not pushing. To complete, push "${curBranch}" branch from ${dir}`;
};

const pushNewBranchUnlessDryRun = async (fc: PrepareArgs, dir: string, git: SimpleGit): Promise<void> => {
  if (fc.dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await Git.pushNewBranch(git);
  }
};

const pushUnlessDryRun = async (fc: PrepareArgs, dir: string, git: SimpleGit) => {
  if (fc.dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await Git.push(git);
  }
};

const updatePackageJsonFileForReleaseBranch = async (version: Version, pj: PackageJson, pjFile: string): Promise<void> => {
  const branchVersion = releaseBranchVersion(version);
  PackageJson.setVersion(pj, O.some(branchVersion));
  await PackageJson.writePackageJsonFile(pjFile, pj);
};

const branchShouldNotExist = async (git: SimpleGit, branchName: string): Promise<void> => {
  if (await Git.doesRemoteBranchExist(git, branchName)) {
    throw new Error(`Remote branch already exists: ${branchName}`);
  }
}

const updatePackageJsonFileForMainBranch = async (version: Version, pj: PackageJson, pjFile: string): Promise<Version> => {
  const newMainVersion = newMainBranchVersion(version);
  PackageJson.setVersion(pj, O.some(newMainVersion));
  await PackageJson.writePackageJsonFile(pjFile, pj);
  return newMainVersion;
};
export const runPrepare = async (fc: PrepareArgs, gitUrl: string): Promise<void> => {
  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Freeze${dryRunMessage}`);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  console.log(`Cloned to ${dir}`);

  const mainBranch = Hardcoded.mainBranch;
  console.log(`Checking out ${mainBranch}`);
  await git.checkout(mainBranch);

  console.log(`Parsing package.json file in dir: ${dir}`);

  const pjFile = PackageJson.pjInFolder(dir);
  const pj = await PackageJson.parsePackageJsonFile(pjFile);

  const version = await optionToPromise(pj.version, "Version missing in package.json file");
  console.log(version);
  console.log(`package.json has version: ${Version.versionToString(version)})`);
  const releaseBranchName = BranchRules.releaseBranchName(version);

  await BranchRules.checkMainBranchVersion(version, 'package.json');
  await branchShouldNotExist(git, releaseBranchName);

  console.log(`Creating ${releaseBranchName} branch`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);
  await updatePackageJsonFileForReleaseBranch(version, pj, pjFile);
  await git.add(buildPropertiesFile);
  await git.add(pjFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await pushNewBranchUnlessDryRun(fc, dir, git);

  console.log(`Updating ${mainBranch} branch`);
  await git.checkout(mainBranch);
  await updatePackageJsonFileForMainBranch(version, pj, pjFile);
  await git.add(pjFile);
  await git.commit(`Updating version`);
  await pushUnlessDryRun(fc, dir, git);
};
