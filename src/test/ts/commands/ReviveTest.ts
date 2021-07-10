import { describe, it } from 'mocha';
import { assert } from 'chai';
import { versionFromReleaseBranch } from '../../../main/ts/core/BranchLogic';
import { versionToString } from '../../../main/ts/core/Version';
import * as Git from '../../../main/ts/utils/Git';
import { beehiveFlow, makeBranchWithPj, makeReleaseTags, readPjVersionInDir } from './TestUtils';

describe('Revive', () => {
  const runScenario = async (tags: string[], branches: string[], arg: string) => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    const packageName = 'test-revive';
    await makeBranchWithPj(git, 'main', dir, packageName, '0.1.1-rc');
    await makeReleaseTags(git, dir, packageName, tags);
    for (const branch of branches) {
      const version = await versionFromReleaseBranch(branch);
      await makeBranchWithPj(git, branch, dir, packageName, versionToString({ patch: 0, ...version }));
    }

    await beehiveFlow([ 'revive', arg, '--working-dir', dir ]);
    await git.pull();
    await git.checkout(`release/${arg}`);
    return { git, dir };
  };

  const TIMEOUT = 4000;

  it('revives version from 1.0.0 tag', async () => {
    const { git, dir } = await runScenario([ '0.1.0', '1.0.0' ], [], '1.0');
    await assert.becomes(Git.currentBranch(git), 'release/1.0');
    await assert.becomes(readPjVersionInDir(dir), '1.0.1-rc');
  }).timeout(TIMEOUT);

  it('revives version when multiple tags exist', async () => {
    const { git, dir } = await runScenario([ '0.1.0', '1.0.0', '1.1.0', '1.1.1', '1.1.2' ], [ 'release/1.0' ], '1.1');
    await assert.becomes(Git.currentBranch(git), 'release/1.1');
    await assert.becomes(readPjVersionInDir(dir), '1.1.3-rc');
  }).timeout(TIMEOUT);

  it('fails if a release branch already exists', async () => {
    const result = runScenario([ '1.0.0' ], [ 'release/1.0' ], '1.0');
    await assert.isRejected(result, 'Remote branch already exists: release/1.0');
  }).timeout(TIMEOUT);

  it('fails if main is at the same major.minor version', async () => {
    const result = runScenario([ '0.0.1' ], [], '0.1');
    await assert.isRejected(result, 'main branch is still at version: 0.1');
  }).timeout(TIMEOUT);

  it('fails if no tags exist for the specified major.major version', async () => {
    const result = runScenario([ '0.0.1' ], [], '1.0');
    await assert.isRejected(result, 'Failed to find any tags matching version: 1.0');
  }).timeout(TIMEOUT);
});
