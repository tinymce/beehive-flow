import * as gitP from 'simple-git/promise';
import { SimpleGit } from 'simple-git';
import { AdvanceArgs, AdvanceCiArgs, BeehiveArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import { BranchState, getReleaseBranchName, inspectRepo } from '../core/BranchLogic';
import { PackageJson, writePackageJsonFileWithNewVersion } from '../core/PackageJson';
import * as PromiseUtils from '../utils/PromiseUtils';
import { releaseCandidate } from '../core/PreRelease';

type Version = Version.Version;
const { versionToString } = Version;

export const updateVersion = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
  preRelease: releaseCandidate
});

const go = async (version: Version, pj: PackageJson, pjFile: string, git: SimpleGit, fc: BeehiveArgs, dir: string): Promise<void> => {
  const newVersion = updateVersion(version);
  console.log(`Updating version from ${versionToString(version)} to ${versionToString(newVersion)}`);
  await writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);

  await git.add(pjFile);
  await git.commit('Advancing to release candidate version for next patch release');

  await Git.pushUnlessDryRun(fc, dir, git);
};

export const advance = async (fc: AdvanceArgs): Promise<void> => {
  const gitUrl = await Git.resolveGitUrl(fc.gitUrl);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);

  const rbn = getReleaseBranchName(fc.majorMinorVersion);
  await Git.checkout(git, rbn);

  const r = await inspectRepo(dir);
  if (r.branchState !== BranchState.ReleaseReady) {
    return PromiseUtils.fail('Branch is not in release ready state - can\'t advance. Check that the version is x.y.z with no suffix.');
  }
  await go(r.version, r.packageJson, r.packageJsonFile, git, fc, dir);
};

export const advanceCi = async (fc: AdvanceCiArgs): Promise<void> => {
  const dir = process.cwd();

  const r = await inspectRepo(dir);
  if (r.branchState !== BranchState.ReleaseReady) {
    console.log('Not in release ready state - not advancing version.');
  } else {
    const git = gitP(dir);
    await go(r.version, r.packageJson, r.packageJsonFile, git, fc, dir);
  }
};
