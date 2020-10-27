import { gitP } from 'simple-git';
import { DateTime } from 'luxon';
import { StampArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import * as Version from '../core/Version';
import * as Clock from '../core/Clock';
import { writePackageJsonFileWithNewVersion } from '../core/PackageJson';
import * as RepoState from '../core/RepoState';
import { featureBranch, hotfixBranch, mainBranch, releaseCandidate } from '../core/PreRelease';
import { detectRepoState } from '../core/BranchLogic';

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
          return mainBranch;
        case 'ReleaseCandidate':
          return releaseCandidate;
        case 'Feature':
          return featureBranch;
        case 'Hotfix':
          return hotfixBranch;
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

  const r = await detectRepoState(dir);
  const newVersion = chooseNewVersion(r, gitSha, clock.getTimeMillis());
  await writePackageJsonFileWithNewVersion(r.packageJson, newVersion, r.packageJsonFile);

  console.log('Note: this command does not commit changes to package.json.');
};
