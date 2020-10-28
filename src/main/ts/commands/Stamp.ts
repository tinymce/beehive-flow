import { gitP } from 'simple-git';
import { DateTime } from 'luxon';
import { StampArgs } from '../args/BeehiveArgs';
import * as Git from '../utils/Git';
import * as Version from '../core/Version';
import * as Clock from '../core/Clock';
import { writePackageJsonFileWithNewVersion } from '../core/PackageJson';
import * as RepoState from '../core/RepoState';
import * as PreRelease from '../core/PreRelease';
import { detectRepoState } from '../core/BranchLogic';

type Version = Version.Version;
type Clock = Clock.Clock;
type RepoState = RepoState.RepoState;

export const timeFormat = 'yyyyMMddHHmmssSSS';

export const formatDate = (timeMillis: number): string =>
  DateTime.fromMillis(timeMillis, { zone: 'utc' }).toFormat(timeFormat, { timeZone: 'utc' });

export const chooseNewVersion = ({ kind, version }: Pick<RepoState, 'kind' | 'version'>, gitSha: string, timeMillis: number): Version => {
  if (kind === 'Release') {
    return version;
  } else {

    const prePre = (() => {
      switch (kind) {
        case 'Main':
          return PreRelease.mainBranch;
        case 'ReleaseCandidate':
          return PreRelease.releaseCandidate;
        case 'Feature':
          return PreRelease.featureBranch;
        case 'Hotfix':
          return PreRelease.hotfixBranch;
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

export const stamp = async (fc: StampArgs, clock: Clock = Clock.realClock()): Promise<void> => {
  const dir = process.cwd();
  const git = gitP(dir);
  const gitSha = await Git.currentRevisionShortSha(git);

  const r = await detectRepoState(dir);
  const newVersion = chooseNewVersion(r, gitSha, clock.getTimeMillis());
  await writePackageJsonFileWithNewVersion(r.packageJson, newVersion, r.packageJsonFile);

  console.log('Note: this command does not commit changes to package.json.');
};
