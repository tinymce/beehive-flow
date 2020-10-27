import * as gitP from 'simple-git/promise';
import { SimpleGit } from 'simple-git';
import { AdvanceArgs, AdvanceCiArgs, BeehiveArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as BranchLogic from '../core/BranchLogic';
import * as Inspect from '../core/Inspect';
import {
  gitCheckout,
  gitPushUnlessDryRun,
  readPackageJsonFileInDirAndRequireVersion,
  writePackageJsonFileWithNewVersion
} from '../core/Noisy';
import * as RepoState from '../core/RepoState';
import { PackageJson } from '../core/PackageJson';

type Version = Version.Version;
const { versionToString } = Version;

export const updateVersion = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
  preRelease: HardCoded.releaseBranchReleaseCandidatePrereleaseVersion
});

const go = async function (version: Version, pj: PackageJson, pjFile: string, git: SimpleGit, fc: BeehiveArgs, dir: string): Promise<void> {
  const newVersion = updateVersion(version);
  console.log(`Updating version from ${versionToString(version)} to ${versionToString(newVersion)}`);
  await writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);

  await git.add(pjFile);
  await git.commit('Advancing to release candidate version for next patch release');

  // TODO: ff-only?
  await gitPushUnlessDryRun(fc, dir, git);
};

export const advance = async (fc: AdvanceArgs): Promise<void> => {
  const gitUrl = await Inspect.resolveGitUrl(fc.gitUrl);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);
  console.log(`Cloned to ${dir}`);

  const rbn = BranchLogic.releaseBranchName(fc.majorMinorVersion);
  await gitCheckout(git, rbn);
  const { pjFile, pj, version } = await readPackageJsonFileInDirAndRequireVersion(dir);

  await BranchLogic.checkReleaseBranchReleaseVersion(version, fc.majorMinorVersion, rbn, 'package.json');
  await go(version, pj, pjFile, git, fc, dir);
};

export const advanceCi = async (fc: AdvanceCiArgs): Promise<void> => {
  const dir = process.cwd();

  const r = await RepoState.detectRepoState(dir);
  if (r.kind !== 'Release') {
    console.log('Not in Release state - not advancing version.');
  } else {
    console.log('Advancing to next rc version');
    const git = gitP(dir);
    const version = r.version;
    await go(version, r.packageJson, r.packageJsonFile, git, fc, dir);
  }
};
