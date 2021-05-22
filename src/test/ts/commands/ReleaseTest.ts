import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Git from '../../../main/ts/utils/Git';
import { beehiveFlow, makeBranchWithPj, readPjVersionInDir } from './TestUtils';

describe('Release', () => {
  const runScenario = async (branchName: string, version: string, arg: string) => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);
    await makeBranchWithPj(git, branchName, dir, 'test-release', version);
    await beehiveFlow([ 'release', arg, '--working-dir', dir ]);
    await git.pull();
    return dir;
  };

  it('releases rc version from main', async () => {
    const dir = await runScenario('main', '0.0.1-rc', 'main');
    await assert.becomes(readPjVersionInDir(dir), '0.0.1');
  });

  it('releases rc version from release branch', async () => {
    const dir = await runScenario('release/88.1', '88.1.9-rc', '88.1');
    await assert.becomes(readPjVersionInDir(dir), '88.1.9');
  });
});
