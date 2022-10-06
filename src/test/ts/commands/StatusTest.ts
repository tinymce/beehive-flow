import * as cp from 'child_process';
import { assert } from 'chai';
import * as O from 'fp-ts/Option';
import { describe, it } from 'mocha';
import * as BeehiveArgs from '../../../main/ts/args/BeehiveArgs';
import * as Status from '../../../main/ts/commands/Status';
import * as Git from '../../../main/ts/utils/Git';
import * as TestUtils from './TestUtils';

const newGit = async (): Promise<Git.TempGit> => {
  const hub = await Git.initInTempFolder(true);
  return Git.cloneInTempFolder(hub.dir, O.none);
};

const check = async (dir: string, expected: Object) => {
  const r = await Status.getStatusJson(BeehiveArgs.statusArgs(false, dir));
  assert.deepEqual(JSON.parse(r), expected);
};

describe('Status', () => {
  let verdaccio: cp.ChildProcess;
  let address: string;

  before(async () => {
    const v = await TestUtils.startVerdaccio();
    verdaccio = v.verdaccio;
    address = v.address;
  });

  after(() => {
    verdaccio.kill();
  });

  it('shows status for main branch in preRelease state', async () => {
    const { dir, git } = await newGit();
    await TestUtils.makeBranchWithPj(git, 'main', dir, 'test-status', '0.1.0-rc', undefined, {}, address);

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
    await TestUtils.makeBranchWithPj(git, 'main', dir, 'test-status', '0.7.0', undefined, {}, address);

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
    await TestUtils.makeBranchWithPj(git, 'release/1.98', dir, 'test-status', '1.98.2-rc', undefined, {}, address);

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
    await TestUtils.makeBranchWithPj(git, 'release/1.98', dir, 'test-status', '1.98.7', undefined, {}, address);

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

  it('shows status for dependabot branch in feature state', async () => {
    const { dir, git } = await newGit();
    await TestUtils.makeBranchWithPj(
      git,
      'dependabot/npm_and_yarn/package-1.98.0',
      dir, 'test-status',
      '0.1.0-feature.20210525.shaabcdef',
      undefined,
      {},
      address
    );

    await check(dir, {
      branchState: 'feature',
      isLatest: true,
      currentBranch: 'dependabot/npm_and_yarn/package-1.98.0',
      branchType: 'dependabot',
      version: {
        major: 0,
        minor: 1,
        patch: 0,
        preRelease: 'feature.20210525.shaabcdef'
      },
      versionString: '0.1.0-feature.20210525.shaabcdef'
    });
  }).timeout(20000);

  // TODO TINY-6924: Add test case where isLatest returns false. Will need to publish, or mock out listing tags.
});
