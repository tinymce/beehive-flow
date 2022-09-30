import * as O from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as AdvanceVersion from '../core/AdvanceVersion';
import * as PackageJson from '../core/PackageJson';
import * as PromiseUtils from '../utils/PromiseUtils';
import { BranchState, getBranchDetails, Module } from '../core/BranchLogic';
import * as Changelog from '../keepachangelog/Changelog';
import { printHeaderMessage } from '../core/Messages';

const updateChangelog = async (git: SimpleGit, dryRun: boolean, version: Version.Version, module: Module) => {
  const changelogFile = module.changelogFile;
  if (module.changelogFormat === 'none') {
    console.log('No changelog file found');
  } else if (dryRun) {
    console.log('dry-run - not updating the changelog');
  } else {
    // NOTE: Add other changelog formats updates here if we support more
    await Changelog.updateFromFile(changelogFile, version);
    await git.add(changelogFile);
  }
};

export const release = async (args: ReleaseArgs): Promise<void> => {
  printHeaderMessage(args);

  // If we are releasing from the working directory, check for un-pushed local changes
  if (O.isNone(args.gitUrl)) {
    const hasLocalChanges = await Git.hasLocalChanges(args.workingDir, args.branchName);
    if (hasLocalChanges) {
      return PromiseUtils.fail('Local changes are ahead of origin. Commit and/or push local changes and try again.');
    }
  }

  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  await Git.checkout(git, args.branchName);

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseCandidate) {
    return PromiseUtils.fail('Branch is not in Release Candidate state - can\'t release.');
  }

  const rootModule = branchDetails.rootModule;
  if (!args.allowPreReleaseDeps) {
    await PackageJson.shouldNotHavePreReleasePackages(rootModule.packageJson);
  }

  const newVersion = AdvanceVersion.updateToStable(branchDetails.version);
  console.log(`Updating version from ${Version.versionToString(branchDetails.version)} to ${Version.versionToString(newVersion)}`);
  await PackageJson.writePackageJsonFileWithNewVersion(rootModule.packageJson, newVersion, rootModule.packageJsonFile);

  if (!args.noChangelog) {
    await updateChangelog(git, args.dryRun, newVersion, rootModule);
  }

  await git.add(rootModule.packageJsonFile);
  await git.commit('Branch is ready for release - setting release version');

  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};
