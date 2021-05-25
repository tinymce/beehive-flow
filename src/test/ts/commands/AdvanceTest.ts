import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Git from '../../../main/ts/utils/Git';
import { makeBranchWithPj, beehiveFlow, readPjVersionInDir } from './TestUtils';

describe('Advance', () => {
  describe('advance', () => {
    const runScenario = async (branchName: string, version: string, arg: string) => {
      const hub = await Git.initInTempFolder(true);
      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await makeBranchWithPj(git, branchName, dir, 'test-advance', version);
      await beehiveFlow([ 'advance', arg, '--working-dir', dir ]);
      await git.pull();
      return dir;
    };

    it('advances main branch in release state', async () => {
      const dir = await runScenario('main', '1.2.3', 'main');
      await assert.becomes(readPjVersionInDir(dir), '1.2.4-rc');
    });

    it('advances feature branch in release state', async () => {
      const dir = await runScenario('release/6.7', '6.7.0', '6.7');
      await assert.becomes(readPjVersionInDir(dir), '6.7.1-rc');
    });
  });

  describe('advance-ci', () => {
    const runScenario = async (branchName: string, version: string) => {
      const hub = await Git.initInTempFolder(true);
      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await makeBranchWithPj(git, branchName, dir, 'test-advance', version);
      await beehiveFlow([ 'advance-ci', '--working-dir', dir ]);
      await git.pull();
      return dir;
    };

    it('advances main branch in release state', async () => {
      const dir = await runScenario('main', '1.2.3');
      await assert.becomes(readPjVersionInDir(dir), '1.2.4-rc');
    });

    it('does nothing for main branch in rc state', async () => {
      const dir = await runScenario('main', '1.2.3-rc');
      await assert.becomes(readPjVersionInDir(dir), '1.2.3-rc');
    });

    it('advances feature branch in release state', async () => {
      const dir = await runScenario('release/6.7', '6.7.0');
      await assert.becomes(readPjVersionInDir(dir), '6.7.1-rc');
    });

    it('does nothing for feature branch in rc state', async () => {
      const dir = await runScenario('release/6.7', '6.7.78-rc');
      await assert.becomes(readPjVersionInDir(dir), '6.7.78-rc');
    });
  });
});
