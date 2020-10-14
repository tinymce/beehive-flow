import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as Git from '../utils/Git';
import * as Hardcoded from '../args/Hardcoded';
import * as PackageJson from '../data/PackageJson';
import * as Version from '../data/Version';
import * as Files from '../utils/Files';
import { optionToPromise } from '../utils/PromiseUtils';
import { PrepArgs } from '../args/Args';

// TODO: Pass in git repo / git url? Use current checkout?

export const prep = (fc: PrepArgs): Promise<void> =>
  runFreeze(fc, Hardcoded.testGitUrl);

export const runFreeze = async (fc: PrepArgs, gitUrl: string): Promise<void> => {
  console.log('Freeze' + (fc.dryRun ? ' (dry-run)' : ''));

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  console.log(`Cloned to ${dir}`);

  console.log('Checking out master');
  await git.checkout('master');

  console.log(`Parsing package.json file in dir: ${dir}`);
  const pj = await PackageJson.parsePackageJsonFileInFolder(dir);

  const version = await optionToPromise(pj.version, "Version missing in package.json file");
  console.log(`package.json has version: ${pj.version}`);
  const releaseBranchName = Version.releaseBranchName(version);

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error(`Remote branch already exists: ${releaseBranchName}`);
  }

  console.log(`Creating release branch: ${releaseBranchName}`);
  await Git.checkoutNewBranch(git, releaseBranchName);

  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    console.log(`${buildPropertiesFile} does not exist: creating`);
    await Files.writeFile(buildPropertiesFile, '');
  }

  console.log(`Updating properties file: ${buildPropertiesFile}`);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);

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
