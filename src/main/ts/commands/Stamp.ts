import { gitP } from 'simple-git';
import { DateTime } from 'luxon';
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

export const timeFormat = 'yyyyMMddHHmmssSSS';

export const formatDate = (timeMillis: number): string =>
  DateTime.fromMillis(timeMillis, { zone: 'utc' }).toFormat(timeFormat, { timeZone: 'utc' });

export const validateBranchAndChooseNewVersion = async (currentBranch: string, version: Version, gitSha: string, timeMillis: number): Promise<Version> => {

  const dt = formatDate(timeMillis);
  const buildMetaData = `${gitSha}`;

  if (currentBranch === HardCoded.mainBranch) {
    await BranchLogic.checkMainBranchVersion(version, 'package.json');
    return {
      ...version,
      preRelease: `${HardCoded.mainBranchPreReleaseVersion}.${dt}`,
      buildMetaData
    };

  } else if (BranchLogic.isReleaseBranch(currentBranch)) {
    const bv = await BranchLogic.versionFromReleaseBranch(currentBranch);
    if (Version.isReleaseVersion(version)) {
      // Don't change anything for a release version
      await BranchLogic.checkReleaseBranchReleaseVersion(version, bv, currentBranch, 'package.json');
      return version;
    } else {
      await BranchLogic.checkReleaseBranchPreReleaseVersion(version, bv, currentBranch, 'package.json');
      return {
        ...version,
        preRelease: `${HardCoded.releaseBranchReleaseCandidatePrereleaseVersion}.${dt}`,
        buildMetaData
      };
    }

  } else if (BranchLogic.isFeatureBranch(currentBranch)) {
    return {
      ...version,
      preRelease: `${HardCoded.featureBranchPreReleaseVersion}.${dt}`,
      buildMetaData
    };

  } else if (BranchLogic.isHotfixBranch(currentBranch)) {
    return {
      ...version,
      preRelease: `${HardCoded.hotfixBranchPrereleaseVersion}.${dt}`,
      buildMetaData
    };

  } else {
    return PromiseUtils.fail(
      `Current branch "${currentBranch}" is not a valid branch type for beehive flow. Branches may only be "main", "release/x.y", "hotfix/*" or "feature/*"`);
  }
};

export const stamp = async (fc: StampArgs, clock: Clock = Clock.realClock()): Promise<void> => {
  const dir = process.cwd();
  const git = gitP(dir);

  const currentBranch = await Git.currentBranch(git);
  const gitSha = await Git.currentRevisionShortSha(git);

  const { version, pj, pjFile } = await readPackageJsonFileInDirAndRequireVersion(dir);
  const newVersion = await validateBranchAndChooseNewVersion(currentBranch, version, gitSha, clock.getTimeMillis());

  await writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);

  console.log('Note: this command does not commit changes to package.json.');
};
