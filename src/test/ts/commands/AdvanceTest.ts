import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Advance from '../../../main/ts/commands/Advance';
import * as Version from '../../../main/ts/core/Version';
import * as Git from '../../../main/ts/utils/Git';
import { makeBranchWithPj, beehiveFlow, readPjVersionInDir } from './TestUtils';

describe('Advance', () => {
  describe('updateVersion', () => {
    it('Updates versions', async () => {
      const check = async (input: string, expected: string) => {
        assert.equal(Version.versionToString(Advance.updateVersion(await Version.parseVersion(input))), expected);
      };
      await check('0.0.0', '0.0.1-rc');
      await check('1.0.0', '1.0.1-rc');
      await check('0.300.100', '0.300.101-rc');
    });
  });

  describe('advance', () => {
    const runScenario = async (branchName: string, version: string, arg: string) => {
      const hub = await Git.initInTempFolder(true);
      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await makeBranchWithPj(git, branchName, 'blah://frog', dir, 'test-advance', version);
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
      await makeBranchWithPj(git, branchName, 'blah://frog', dir, 'test-advance', version);
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
