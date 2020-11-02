import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as O from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import * as Git from '../utils/Git';
import * as PackageJson from '../core/PackageJson';
import { BranchState, BranchDetails, inspectRepo, getReleaseBranchName } from '../core/BranchLogic';
import * as Files from '../utils/Files';
import { PrepareArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Prerelease from '../core/PreRelease';

type PackageJson = PackageJson.PackageJson;
type Version = Version.Version;

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
  preRelease: Prerelease.mainBranch
});

export const releaseBranchVersion = (oldMainBranchVersion: Version): Version => ({
  major: oldMainBranchVersion.major,
  minor: oldMainBranchVersion.minor,
  patch: 0,
  preRelease: Prerelease.releaseCandidate
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

const createReleaseBranch = async (releaseBranchName: string, git: SimpleGit, dir: string, bd: BranchDetails, fc: PrepareArgs): Promise<void> => {
  console.log(`Creating ${releaseBranchName} branch`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);
  await updatePackageJsonFileForReleaseBranch(bd.version, bd.packageJson, bd.packageJsonFile);
  await git.add(buildPropertiesFile);
  await git.add(bd.packageJsonFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await Git.pushNewBranchUnlessDryRun(fc, dir, git);
};

const updateMainBranch = async (mainBranch: string, git: SimpleGit, bd: BranchDetails, fc: PrepareArgs, dir: string): Promise<void> => {
  console.log(`Updating ${mainBranch} branch`);
  await git.checkout(mainBranch);
  await updatePackageJsonFileForMainBranch(bd.version, bd.packageJson, bd.packageJsonFile);
  await git.add(bd.packageJsonFile);
  await git.commit(`Updating version`);
  await Git.pushUnlessDryRun(fc, dir, git);
};

export const prepare = async (args: PrepareArgs): Promise<void> => {
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  const mainBranch = await Git.checkoutMainBranch(git);

  const r = await inspectRepo(dir);
  if (r.branchState !== BranchState.Main) {
    return PromiseUtils.fail('main branch not in correct state.');
  }

  const releaseBranchName = getReleaseBranchName(r.version);

  await Git.branchShouldNotExist(git, releaseBranchName);
  await createReleaseBranch(releaseBranchName, git, dir, r, args);
  await updateMainBranch(mainBranch, git, r, args, dir);
};
