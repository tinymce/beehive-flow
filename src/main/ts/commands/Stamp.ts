import { gitP } from 'simple-git';
import { StampArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as BranchLogic from '../core/BranchLogic';
import * as Version from '../core/Version';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Clock from '../core/Clock';
import { readPackageJsonFileInDirAndRequireVersion, writePackageJsonFileWithNewVersion } from '../core/Noisy';

type Version = Version.Version;
type Clock = Clock.Clock;

const validateBranchAndChooseNewVersion = async (currentBranch: string, version: Version, gitSha: string, clock: Clock): Promise<Version> => {
  const buildMetaData = `${gitSha}.${clock.getTimeMillis()}`;
  const newVersion = {
    ...version,
    buildMetaData
  };
  if (currentBranch === HardCoded.mainBranch) {
    await BranchLogic.checkMainBranchVersion(version, 'package.json');
    return newVersion;
  } else if (BranchLogic.isReleaseBranch(currentBranch)) {
    const bv = await BranchLogic.versionFromReleaseBranch(currentBranch);
    if (Version.isReleaseVersion(version)) {
      return PromiseUtils.fail('Current branch is a release version, so we should not be stamping the version.');
    } else {
      await BranchLogic.checkReleaseBranchPreReleaseVersion(version, bv, currentBranch, 'package.json');
      return newVersion;
    }
  } else if (BranchLogic.isFeatureBranch(currentBranch)) {
    return newVersion;
  } else {
    return PromiseUtils.fail(
      `Current branch "${currentBranch}" is not a valid branch type for beehive flow. Branches may only be "main", "release/x.y" or "feature/*"`);
  }
};

export const stamp = async (fc: StampArgs, clock: Clock = Clock.realClock()): Promise<void> => {
  console.log('Stamp');

  const dir = process.cwd();

  const git = gitP(dir);

  const currentBranch = await Git.currentBranch(git);
  const gitSha = await Git.currentRevisionShortSha(git);

  const { version, pj, pjFile } = await readPackageJsonFileInDirAndRequireVersion(dir);
  const newVersion = await validateBranchAndChooseNewVersion(currentBranch, version, gitSha, clock);

  await writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);

  console.log('Note: this command does not commit changes to package.json.');
};
