import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as O from 'fp-ts/Option';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as PackageJson from '../core/PackageJson';
import * as BranchLogic from '../core/BranchLogic';
import * as Files from '../utils/Files';
import { PrepareArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import {
  branchShouldNotExist,
  checkoutMainBranch,
  gitPushNewBranchUnlessDryRun,
  gitPushUnlessDryRun,
  readPackageJsonFileInDirAndRequireVersion
} from '../core/Noisy';

type PackageJson = PackageJson.PackageJson;
type Version = Version.Version;

// TODO: Pass in git repo / git url? Use current checkout?

export const prepare = (fc: PrepareArgs): Promise<void> =>
  runPrepare(fc, HardCoded.testGitUrl);

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
  preRelease: HardCoded.mainBranchPreReleaseVersion
});

export const releaseBranchVersion = (oldMainBranchVersion: Version): Version => ({
  major: oldMainBranchVersion.major,
  minor: oldMainBranchVersion.minor,
  patch: 0,
  preRelease: HardCoded.releaseBranchPreReleaseVersion
});

const updatePackageJsonFileForReleaseBranch = async (version: Version, pj: PackageJson, pjFile: string): Promise<void> => {
  const branchVersion = releaseBranchVersion(version);
  const newPj = PackageJson.setVersion(pj, O.some(branchVersion));
  await PackageJson.writePackageJsonFile(pjFile, newPj);
};

const updatePackageJsonFileForMainBranch = async (version: Version, pj: PackageJson, pjFile: string): Promise<Version> => {
  const newMainVersion = newMainBranchVersion(version);
  const newPj = PackageJson.setVersion(pj, O.some(newMainVersion));
  await PackageJson.writePackageJsonFile(pjFile, newPj);
  return newMainVersion;
};

export const runPrepare = async (fc: PrepareArgs, gitUrl: string): Promise<void> => {
  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Prepare${dryRunMessage}`);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);
  console.log(`Cloned to ${dir}`);
  const mainBranch = await checkoutMainBranch(git);

  console.log(`Parsing package.json file in dir: ${dir}`);

  const { pjFile, pj, version } = await readPackageJsonFileInDirAndRequireVersion(dir);
  const releaseBranchName = BranchLogic.releaseBranchName(version);

  await BranchLogic.checkMainBranchVersion(version, 'package.json');
  await branchShouldNotExist(git, releaseBranchName);

  console.log(`Creating ${releaseBranchName} branch`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);
  await updatePackageJsonFileForReleaseBranch(version, pj, pjFile);
  await git.add(buildPropertiesFile);
  await git.add(pjFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await gitPushNewBranchUnlessDryRun(fc, dir, git);

  console.log(`Updating ${mainBranch} branch`);
  await git.checkout(mainBranch);
  await updatePackageJsonFileForMainBranch(version, pj, pjFile);
  await git.add(pjFile);
  await git.commit(`Updating version`);
  await gitPushUnlessDryRun(fc, dir, git);
};
