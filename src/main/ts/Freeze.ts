import * as Git from './Git';
import * as Hardcoded from './Hardcoded';
import * as PackageJson from "./PackageJson";
import * as Version from "./Version";
import * as Files from "./Files";
import * as path from "path";
import * as PropertiesReader from "properties-reader";

// TODO: Pass in git repo / git url? Use current checkout?

export const freeze = (): Promise<void> =>
  runFreeze(Hardcoded.tinymceGitUrl)

const logb = (message: string): void =>
  console.log(' - ' + message);

export const runFreeze = async (gitUrl: string): Promise<void> => {
  console.log("Creating release branch based on 'master' branch (in temp folder)");

  logb('Cloning ' + gitUrl)
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  logb('Cloned to ' + dir)

  logb('Checking out master');
  await git.checkout('master');

  const pjFileName = path.resolve(dir, 'modules', 'tinymce', 'package.json');

  logb('Parsing package.json file: ' + pjFileName);
  const pj = await PackageJson.parsePackageJsonFile(pjFileName);
  logb('package.json has version: ' + Version.versionToString(pj.version));

  const releaseBranchName = Version.releaseBranchName(pj.version);

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error('Remote branch already exists: ' + releaseBranchName);
  }

  logb('Creating release branch: ' + releaseBranchName);
  await Git.checkoutNewBranch(git, releaseBranchName);

  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    logb(buildPropertiesFile + ' does not exist: creating');
    await Files.writeFile(buildPropertiesFile, '');
  }

  logb('Updating properties file: ' + buildPropertiesFile);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);

  logb('Committing and pushing');
  await git.add(buildPropertiesFile);
  await git.commit("Creating release branch: " + releaseBranchName);
  await Git.pushNewBranch(git);
};
