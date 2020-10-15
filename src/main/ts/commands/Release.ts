import * as O from 'fp-ts/Option';
import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as BranchLogic from '../core/BranchLogic';
import * as PackageJson from '../core/PackageJson';
import { gitCheckout, gitPushUnlessDryRun, readPackageJsonFileInDirAndRequireVersion } from '../core/Noisy';

type Version = Version.Version;
const { versionToString, majorMinorVersionToString } = Version;

export const release = async (fc: ReleaseArgs): Promise<void> =>
  runRelease(fc, HardCoded.testGitUrl);

const updateVersion = (version: Version) => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch
});

export const runRelease = async (fc: ReleaseArgs, gitUrl: string): Promise<void> => {
  const sMajorMinor = majorMinorVersionToString(fc.majorMinorVersion);

  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Release${dryRunMessage} ${sMajorMinor}`);

  console.log(`Cloning ${gitUrl} to temp folder`);
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  console.log(`Cloned to ${dir}`);

  const rbn = BranchLogic.releaseBranchName(fc.majorMinorVersion);
  await gitCheckout(git, rbn);
  const { pjFile, pj, version } = await readPackageJsonFileInDirAndRequireVersion(dir);

  await BranchLogic.checkReleaseBranchPreReleaseVersion(version, fc.majorMinorVersion, rbn, 'package.json');

  const newVersion = updateVersion(version);
  console.log(`Updating version from ${versionToString(version)} to ${versionToString(newVersion)}`);

  const newPj = PackageJson.setVersion(pj, O.some(newVersion));
  await PackageJson.writePackageJsonFile(pjFile, newPj);

  await git.add(pjFile);
  await git.commit('Branch is ready for release - setting release version');

  await gitPushUnlessDryRun(fc, dir, git);
};
