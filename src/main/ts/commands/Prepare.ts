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

const dryRunMessage = (dir: string): string =>
  `dry-run - not pushing. To complete, run "git push" from ${dir}`;

const pushNewBranchUnlessDryRun = async (fc: PrepareArgs, dir: string, git: SimpleGit): Promise<void> => {
  if (fc.dryRun) {
    console.log(dryRunMessage(dir));
  } else {
    console.log('git push');
    await Git.pushNewBranch(git);
  }
};

const pushUnlessDryRun = async (fc: PrepareArgs, dir: string, git: SimpleGit) => {
  if (fc.dryRun) {
    console.log(dryRunMessage(dir));
  } else {
    console.log('git push');
    await Git.push(git);
  }
};

const updatePackageJsonFileForMainBranch = async (version: Version, pj: PackageJson, pjFile: string): Promise<void> => {
  const branchVersion = releaseBranchVersion(version);
  PackageJson.setVersion(pj, O.some(branchVersion));
  await PackageJson.writePackageJsonFileInFolder(pjFile, pj);
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
  console.log(`package.json has version: ${pj.version}`);
  const releaseBranchName = BranchRules.releaseBranchName(version);

  await BranchRules.checkMainBranchVersion(version, 'package.json');

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error(`Remote branch already exists: ${releaseBranchName}`);
  }

  console.log(`Creating release branch: ${releaseBranchName}`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);
  await updatePackageJsonFileForMainBranch(version, pj, pjFile);

  console.log('git commit');
  await git.add(buildPropertiesFile);
  await git.add(pjFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await pushNewBranchUnlessDryRun(fc, dir, git);

  console.log(`Checking out ${mainBranch}`);
  await git.checkout(mainBranch);

  console.log('Updating version in package.json');
  const newMainVersion = newMainBranchVersion(version);
  PackageJson.setVersion(pj, O.some(newMainVersion));
  await PackageJson.writePackageJsonFileInFolder(pjFile, pj);

  await git.add(buildPropertiesFile);
  await git.add(pjFile);
  await git.commit(`Updating version to ${Version.versionToString(newMainVersion)}`);
  await pushUnlessDryRun(fc, dir, git);
};
