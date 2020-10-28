import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as O from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import * as Git from '../utils/Git';
import * as PackageJson from '../core/PackageJson';
import * as BranchLogic from '../core/BranchLogic';
import * as Files from '../utils/Files';
import { PrepareArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Inspect from '../core/Inspect';
import * as RepoState from '../core/RepoState';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Prerelease from '../core/PreRelease';

type PackageJson = PackageJson.PackageJson;
type Version = Version.Version;
type RepoState = RepoState.RepoState;

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

const createReleaseBranch = async (releaseBranchName: string, git: SimpleGit, dir: string, r: RepoState, fc: PrepareArgs): Promise<void> => {
  console.log(`Creating ${releaseBranchName} branch`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);
  await updatePackageJsonFileForReleaseBranch(r.version, r.packageJson, r.packageJsonFile);
  await git.add(buildPropertiesFile);
  await git.add(r.packageJsonFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await Git.pushNewBranchUnlessDryRun(fc, dir, git);
};

const updateMainBranch = async (mainBranch: string, git: SimpleGit, r: RepoState, fc: PrepareArgs, dir: string): Promise<void> => {
  console.log(`Updating ${mainBranch} branch`);
  await git.checkout(mainBranch);
  await updatePackageJsonFileForMainBranch(r.version, r.packageJson, r.packageJsonFile);
  await git.add(r.packageJsonFile);
  await git.commit(`Updating version`);
  await Git.pushFfOnlyUnlessDryRun(fc, dir, git);
};

export const prepare = async (fc: PrepareArgs): Promise<void> => {
  const gitUrl = await Inspect.resolveGitUrl(fc.gitUrl);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);

  const mainBranch = await Git.checkoutMainBranch(git);

  const r = await BranchLogic.detectRepoState(dir);
  if (r.kind !== 'Main') {
    return PromiseUtils.fail('main branch not in correct state.');
  }

  const releaseBranchName = BranchLogic.releaseBranchName(r.version);

  await Git.branchShouldNotExist(git, releaseBranchName);
  await createReleaseBranch(releaseBranchName, git, dir, r, fc);
  await updateMainBranch(mainBranch, git, r, fc, dir);
};
