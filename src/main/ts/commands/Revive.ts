import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { SimpleGit } from 'simple-git';
import { ReviveArgs } from '../args/BeehiveArgs';
import { createReleaseBranch, getBranchDetails, getReleaseBranchName, versionFromReleaseBranch } from '../core/BranchLogic';
import * as AdvanceVersion from '../core/AdvanceVersion';
import { printHeaderMessage } from '../core/Messages';
import * as Version from '../core/Version';
import * as ArrayUtils from '../utils/ArrayUtils';
import { Comparison } from '../utils/Comparison';
import * as OptionUtils from '../utils/OptionUtils';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Git from '../utils/Git';

type MajorMinorVersion = Version.MajorMinorVersion;
type Version = Version.Version;

interface TagDetails {
  readonly version: Version;
  readonly name: string;
}

const getLatestTagForVersion = async (git: SimpleGit, version: MajorMinorVersion): Promise<TagDetails> => {
  const tags = await Git.getTags(git);
  const tagDetails = OptionUtils.somes(tags.map((tag) => pipe(
    Version.parseVersionE(tag),
    O.fromEither,
    O.filter((v) => Version.compareMajorMinorVersions(v, version) === Comparison.EQ),
    O.map((v) => ({
      version: v,
      name: tag
    }))
  )));
  const sortedDetails = ArrayUtils.sort(tagDetails, (td1, td2) => Version.compareVersions(td1.version, td2.version));
  return PromiseUtils.optionToPromise(
    O.fromNullable(sortedDetails[sortedDetails.length - 1]),
    `Failed to find any tags matching version: ${Version.majorMinorVersionToString(version)}`
  );
};

export const revive = async (args: ReviveArgs): Promise<void> => {
  printHeaderMessage(args);
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  // Verify the branch doesn't already exist
  await Git.branchShouldNotExist(git, args.branchName);

  // Verify we're not trying to setup the version for something that's in main
  const version = await versionFromReleaseBranch(args.branchName);
  await Git.checkoutMainBranch(git);
  const mainBranchDetails = await getBranchDetails(dir);
  if (Version.compareMajorMinorVersions(mainBranchDetails.version, version) === Comparison.EQ) {
    return PromiseUtils.fail(`main branch is still at version: ${Version.majorMinorVersionToString(version)}`);
  }

  // Find the latest git tag that matches the release branch to be created
  const latestTag = await getLatestTagForVersion(git, version);
  await Git.checkout(git, latestTag.name);

  // Rebuild the release branch from the tag
  const releaseBranchName = getReleaseBranchName(latestTag.version);
  await createReleaseBranch(releaseBranchName, git, dir);
  const branchDetails = await getBranchDetails(dir);

  // Advance the version to the new patch release
  const rootModule = branchDetails.rootModule;
  await AdvanceVersion.advancePatch(latestTag.version, rootModule.packageJson, rootModule.packageJsonFile, git);
  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};