import * as path from 'path';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as O from 'fp-ts/Option';
import * as Git from '../../../main/ts/utils/Git';
import * as Files from '../../../main/ts/utils/Files';
import * as Status from '../../../main/ts/commands/Status';
import * as BeehiveArgs from '../../../main/ts/args/BeehiveArgs';

const newGit = async (): Promise<Git.TempGit> => {
  const hub = await Git.initInTempFolder(true);
  return Git.cloneInTempFolder(hub.dir, O.none);
};

const branchWithPj = async ({ dir, git }: Git.TempGit, versionString: string, branchName: string): Promise<void> => {
  await Git.checkoutNewBranch(git, branchName);

  const pjFile = path.join(dir, 'package.json');
  await Files.writeFile(pjFile, `
    {
      "name": "@beehive-test/lifecycle-test",
      "version": "${versionString}"
    }
  `);
  await git.add(pjFile);
  await git.commit('pj');
  await Git.push(git);
};

const check = async (dir: string, expected: Object) => {
  const r = await Status.getStatusJson(BeehiveArgs.statusArgs(false, dir));
  assert.deepEqual(JSON.parse(r), expected);
};

describe('Status', () => {
  it('shows status for main branch in preRelease state', async () => {
    const { dir, git } = await newGit();
    await branchWithPj({ dir, git }, '0.1.0-rc', 'main');

    await check(dir, {
      branchState: 'releaseCandidate',
      isLatest: true,
      currentBranch: 'main',
      branchType: 'main',
      version: {
        major: 0,
        minor: 1,
        patch: 0,
        preRelease: 'rc'
      },
      versionString: '0.1.0-rc'
    });
  }).timeout(20000);

  it('shows status for main branch in releaseReady state', async () => {
    const { dir, git } = await newGit();
    await branchWithPj({ dir, git }, '0.7.0', 'main');

    await check(dir, {
      branchState: 'releaseReady',
      isLatest: true,
      currentBranch: 'main',
      branchType: 'main',
      version: {
        major: 0,
        minor: 7,
        patch: 0
      },
      versionString: '0.7.0'
    });
  }).timeout(20000);

  it('shows status for release branch in preRelease state', async () => {
    const { dir, git } = await newGit();
    await branchWithPj({ dir, git }, '1.98.2-rc', 'release/1.98');

    await check(dir, {
      branchState: 'releaseCandidate',
      isLatest: true,
      currentBranch: 'release/1.98',
      branchType: 'release',
      version: {
        major: 1,
        minor: 98,
        patch: 2,
        preRelease: 'rc'
      },
      versionString: '1.98.2-rc'
    });
  }).timeout(20000);

  it('shows status for release branch in releaseReady state', async () => {
    const { dir, git } = await newGit();
    await branchWithPj({ dir, git }, '1.98.7', 'release/1.98');

    await check(dir, {
      branchState: 'releaseReady',
      isLatest: true,
      currentBranch: 'release/1.98',
      branchType: 'release',
      version: {
        major: 1,
        minor: 98,
        patch: 7
      },
      versionString: '1.98.7'
    });
  }).timeout(20000);

  // TODO TINY-6924: Add test case where isLatest returns false. Will need to publish, or mock out listing tags.
});
