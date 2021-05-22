import { describe, it } from 'mocha';
import { assert } from 'chai';
import { versionFromReleaseBranch } from '../../../main/ts/core/BranchLogic';
import { versionToString } from '../../../main/ts/core/Version';
import * as Git from '../../../main/ts/utils/Git';
import { beehiveFlow, makeBranchWithPj, readPjVersionInDir } from './TestUtils';

describe('Prepare', () => {
  const runScenario = async (version: string, branches: string[] = []) => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    const packageName = 'test-prepare';
    await makeBranchWithPj(git, 'main', dir, packageName, version);
    for (const branch of branches) {
      const releaseVersion = await versionFromReleaseBranch(branch);
      await makeBranchWithPj(git, branch, dir, packageName, versionToString({ patch: 0, ...releaseVersion }));
    }

    await beehiveFlow([ 'prepare', '--working-dir', dir ]);
    await git.pull();
    return { git, dir };
  };

  it('retains the current patch version in the release branch', async () => {
    const { git, dir } = await runScenario( '1.1.2-rc');
    await assert.becomes(readPjVersionInDir(dir), '1.2.0-rc');
    await git.checkout('release/1.1');
    await assert.becomes(readPjVersionInDir(dir), '1.1.2-rc');
  });

  it('fails if the main branch is not an RC version', async () => {
    const result = runScenario('0.1.0');
    await assert.isRejected(result, 'main branch should have an rc version when running this command');
  });

  it('fails if a release branch already exists', async () => {
    const result = runScenario('0.1.0-rc', [ 'release/0.1' ]);
    await assert.isRejected(result, 'Remote branch already exists: release/0.1');
  });
});
