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
import { Version } from '../data/Version';

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

const createReleaseBranch = async (releaseBranchName: string, git: SimpleGit, dir: string, fc: PrepareArgs): Promise<void> => {
  console.log(`Creating release branch: ${releaseBranchName}`);
  await Git.checkoutNewBranch(git, releaseBranchName);
  const buildPropertiesFile = await writeBuildPropertiesFile(dir, releaseBranchName);

  // TODO: change release branch version in package.json

  console.log('git commit');
  await git.add(buildPropertiesFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);

  if (fc.dryRun) {
    console.log(`dry-run - not pushing. To complete, run "git push" from ${dir}`);
  } else {
    console.log('git push');
    await Git.pushNewBranch(git);
  }
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
  const pj = await PackageJson.parsePackageJsonFileInFolder(dir);

  const version = await optionToPromise(pj.version, "Version missing in package.json file");
  console.log(`package.json has version: ${pj.version}`);
  const releaseBranchName = BranchRules.releaseBranchName(version);

  await BranchRules.checkMainBranchVersion(version, 'package.json');

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error(`Remote branch already exists: ${releaseBranchName}`);
  }

  await createReleaseBranch(releaseBranchName, git, dir, fc);

  console.log(`Checking out ${mainBranch}`);
  await git.checkout(mainBranch);

  // TODO: change main branch version in package.json

};
