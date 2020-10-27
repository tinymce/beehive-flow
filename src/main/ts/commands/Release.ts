import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as BranchLogic from '../core/BranchLogic';
import * as PackageJson from '../core/PackageJson';
import * as Inspect from '../core/Inspect';
import * as RepoState from '../core/RepoState';
import * as PromiseUtils from '../utils/PromiseUtils';

type Version = Version.Version;
const { versionToString, majorMinorVersionToString } = Version;

export const updateVersion = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch
});

export const release = async (fc: ReleaseArgs): Promise<void> => {
  const sMajorMinor = majorMinorVersionToString(fc.majorMinorVersion);
  console.log(`${sMajorMinor}`);

  const gitUrl = await Inspect.resolveGitUrl(fc.gitUrl);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);

  const rbn = BranchLogic.releaseBranchName(fc.majorMinorVersion);
  await Git.checkout(git, rbn);

  const r = await RepoState.detectRepoState(dir);
  if (r.kind !== 'ReleaseCandidate') {
    return PromiseUtils.fail('Branch is not in Release Candidate state - can\'t release.');
  }

  const newVersion = updateVersion(r.version);
  console.log(`Updating version from ${versionToString(r.version)} to ${versionToString(newVersion)}`);

  await PackageJson.writePackageJsonFileWithNewVersion(r.packageJson, newVersion, r.packageJsonFile);

  await git.add(r.packageJsonFile);
  await git.commit('Branch is ready for release - setting release version');

  await Git.pushUnlessDryRun(fc, dir, git);
};
