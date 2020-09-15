import * as Git from './Git';
import * as Hardcoded from './Hardcoded';
import * as PackageJson from './PackageJson';
import * as Version from './Version';
import * as Files from './Files';
import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import { eitherToPromise } from './PromiseUtils';

// TODO: Pass in git repo / git url? Use current checkout?

export const freeze = (): Promise<void> =>
  runFreeze(Hardcoded.tinymceGitUrl)

const logb = (message: string): void =>
  console.log(` - ${message}`);

export const runFreeze = async (gitUrl: string): Promise<void> => {
  console.log("Freeze");

  logb(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  logb(`Cloned to ${dir}`)

  logb('Checking out master');
  await git.checkout('master');

  const pjDir = path.resolve(dir, 'modules', 'tinymce');

  logb(`Parsing package.json file in dir: ${pjDir}`);
  const pj = await PackageJson.parsePackageJsonFileInFolder(pjDir);
  if (pj.version === undefined) {
    throw new Error('package.json file has no version');
  }
  logb(`package.json has version: ${pj.version}`);

  const version = await eitherToPromise(Version.parseVersion(pj.version));
  const releaseBranchName = Version.releaseBranchName(version);

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error(`Remote branch already exists: ${releaseBranchName}`);
  }

  logb(`Creating release branch: ${releaseBranchName}`);
  await Git.checkoutNewBranch(git, releaseBranchName);

  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    logb(`${buildPropertiesFile} does not exist: creating`);
    await Files.writeFile(buildPropertiesFile, '');
  }

  logb(`Updating properties file: ${buildPropertiesFile}`);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);

  logb('Committing and pushing');
  await git.add(buildPropertiesFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);
  await Git.pushNewBranch(git);
};
