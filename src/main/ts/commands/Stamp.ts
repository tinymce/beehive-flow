import { gitP } from 'simple-git';
import { DateTime } from 'luxon';
import { StampArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import * as HardCoded from '../args/HardCoded';
import * as Version from '../core/Version';
import * as Clock from '../core/Clock';
import { writePackageJsonFileWithNewVersion } from '../core/PackageJson';
import * as RepoState from '../core/RepoState';

type Version = Version.Version;
type Clock = Clock.Clock;
type RepoState = RepoState.RepoState;

export const timeFormat = 'yyyyMMddHHmmssSSS';

export const formatDate = (timeMillis: number): string =>
  DateTime.fromMillis(timeMillis, { zone: 'utc' }).toFormat(timeFormat, { timeZone: 'utc' });

export const chooseNewVersion = (r: RepoState, gitSha: string, timeMillis: number): Version => {
  if (r.kind === 'Release') {
    return r.version;
  } else {
    const dt = formatDate(timeMillis);
    const buildMetaData = gitSha;

    const prePre = (() => {
      switch (r.kind) {
        case 'Main':
          return HardCoded.mainBranchPreReleaseVersion;
        case 'ReleaseCandidate':
          return HardCoded.releaseBranchReleaseCandidatePrereleaseVersion;
        case 'Feature':
          return HardCoded.featureBranchPreReleaseVersion;
        case 'Hotfix':
          return HardCoded.hotfixBranchPrereleaseVersion;
      }
    })();

    const preRelease = `${prePre}.${dt}`;

    return {
      ...r.version,
      preRelease,
      buildMetaData
    };
  }
};

export const stamp = async (fc: StampArgs, clock: Clock = Clock.realClock()): Promise<void> => {
  const dir = process.cwd();
  const git = gitP(dir);
  const gitSha = await Git.currentRevisionShortSha(git);

  const r = await RepoState.detectRepoState(dir);
  const newVersion = chooseNewVersion(r, gitSha, clock.getTimeMillis());
  await writePackageJsonFileWithNewVersion(r.packageJson, newVersion, r.packageJsonFile);

  console.log('Note: this command does not commit changes to package.json.');
};
