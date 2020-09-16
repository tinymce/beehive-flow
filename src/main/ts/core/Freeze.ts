import * as path from 'path';
import * as PropertiesReader from 'properties-reader';
import * as Git from './Git';
import * as Hardcoded from './Hardcoded';
import * as PackageJson from './PackageJson';
import * as Version from './Version';
import * as Files from './Files';
import { eitherToPromise } from './PromiseUtils';
import { FreezeArgs } from './Args';
import * as Log from './Log';

// TODO: Pass in git repo / git url? Use current checkout?

export const freeze = (fc: FreezeArgs): Promise<void> =>
  runFreeze(fc, Hardcoded.tinymceGitUrl);

export const runFreeze = async (fc: FreezeArgs, gitUrl: string): Promise<void> => {
  const log = Log.get(fc.logLevel);

  log.info('Freeze' + (fc.dryRun ? ' (dry-run)' : ''));

  log.info(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  log.info(`Cloned to ${dir}`);

  log.info('Checking out master');
  await git.checkout('master');

  const pjDir = path.resolve(dir, 'modules', 'tinymce');

  log.info(`Parsing package.json file in dir: ${pjDir}`);
  const pj = await PackageJson.parsePackageJsonFileInFolder(pjDir);
  if (pj.version === undefined) {
    throw new Error('package.json file has no version');
  }
  log.info(`package.json has version: ${pj.version}`);

  const version = await eitherToPromise(Version.parseVersion(pj.version));
  const releaseBranchName = Version.releaseBranchName(version);

  if (await Git.doesRemoteBranchExist(git, releaseBranchName)) {
    throw new Error(`Remote branch already exists: ${releaseBranchName}`);
  }

  log.info(`Creating release branch: ${releaseBranchName}`);
  await Git.checkoutNewBranch(git, releaseBranchName);

  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    log.info(`${buildPropertiesFile} does not exist: creating`);
    await Files.writeFile(buildPropertiesFile, '');
  }

  log.info(`Updating properties file: ${buildPropertiesFile}`);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);

  log.info('git commit');
  await git.add(buildPropertiesFile);
  await git.commit(`Creating release branch: ${releaseBranchName}`);

  if (fc.dryRun) {
    log.warn(`dry-run - not pushing. To complete, run "git push" from ${dir}`);
  } else {
    log.info('git push');
    await Git.pushNewBranch(git);
  }
};
