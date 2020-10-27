import { AdvanceArgs } from '../args/BeehiveArgs';
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

type Version = Version.Version;
const { versionToString, majorMinorVersionToString } = Version;

export const updateVersion = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
  preRelease: HardCoded.releaseBranchPreReleaseVersion
});

export const advance = async (fc: AdvanceArgs): Promise<void> => {
  const sMajorMinor = majorMinorVersionToString(fc.majorMinorVersion);

  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Advance${dryRunMessage} ${sMajorMinor}`);

  const gitUrl = await Inspect.resolveGitUrl(fc.gitUrl);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl, fc.temp);
  console.log(`Cloned to ${dir}`);

  const rbn = BranchLogic.releaseBranchName(fc.majorMinorVersion);
  await gitCheckout(git, rbn);
  const { pjFile, pj, version } = await readPackageJsonFileInDirAndRequireVersion(dir);

  await BranchLogic.checkReleaseBranchReleaseVersion(version, fc.majorMinorVersion, rbn, 'package.json');

  const newVersion = updateVersion(version);
  console.log(`Updating version from ${versionToString(version)} to ${versionToString(newVersion)}`);
  await writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);

  await git.add(pjFile);
  await git.commit('Advancing to release candidate version for next patch release');

  await gitPushUnlessDryRun(fc, dir, git);
};
