import { AdvanceArgs } from '../args/BeehiveArgs';
import * as Version from '../data/Version';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as BranchLogic from '../logic/BranchLogic';
import {
  gitCheckout,
  gitPushUnlessDryRun,
  readPackageJsonFileInDirAndRequireVersion,
  writePackageJsonFileWithNewVersion
} from '../noisy/Noisy';

type Version = Version.Version;
const { versionToString, majorMinorVersionToString } = Version;

export const advance = async (fc: AdvanceArgs): Promise<void> =>
  runAdvance(fc, HardCoded.testGitUrl);

const updateVersion = (version: Version) => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
  preRelease: HardCoded.releaseBranchPreReleaseVersion
});

export const runAdvance = async (fc: AdvanceArgs, gitUrl: string): Promise<void> => {
  const sMajorMinor = majorMinorVersionToString(fc.majorMinorVersion);

  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Release${dryRunMessage} ${sMajorMinor}`);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
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
