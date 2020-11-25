import { gitP } from 'simple-git';
import { DateTime } from 'luxon';
import { StampArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import * as Version from '../core/Version';
import { writePackageJsonFileWithNewVersion } from '../core/PackageJson';
import * as PreRelease from '../core/PreRelease';
import { BranchState, getBranchDetails } from '../core/BranchLogic';

type Version = Version.Version;

export const timeFormat = 'yyyyMMddHHmmssSSS';

export const formatDate = (timeMillis: number): string =>
  DateTime.fromMillis(timeMillis, { zone: 'utc' }).toFormat(timeFormat, { timeZone: 'utc' });

export const chooseNewVersion = (branchState: BranchState, version: Version, gitSha: string, timeMillis: number): Version => {
  if (branchState === BranchState.ReleaseReady) {
    return version;
  } else {

    const prePre = (() => {
      switch (branchState) {
        case BranchState.Main:
          return PreRelease.mainBranch;
        case BranchState.ReleaseCandidate:
          return PreRelease.releaseCandidate;
        case BranchState.Feature:
          return PreRelease.featureBranch;
        case BranchState.Hotfix:
          return PreRelease.hotfixBranch;
        case BranchState.Spike:
          return PreRelease.spikeBranch;
      }
    })();

    const dt = formatDate(timeMillis);
    const preRelease = `${prePre}.${dt}`;

    const buildMetaData = gitSha;

    return {
      ...version,
      preRelease,
      buildMetaData
    };
  }
};

export const stamp = async (args: StampArgs): Promise<void> => {
  const dir = args.workingDir;
  const git = gitP(dir);
  const gitSha = await Git.currentRevisionShortSha(git);

  const branchDetails = await getBranchDetails(dir);
  const newVersion = chooseNewVersion(branchDetails.branchState, branchDetails.version, gitSha, Date.now());
  await writePackageJsonFileWithNewVersion(branchDetails.packageJson, newVersion, branchDetails.packageJsonFile);

  console.log('Note: changes have been made to package.json but they have not been committed.');
};
