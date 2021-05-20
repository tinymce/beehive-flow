import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Release from '../../../main/ts/commands/Release';
import * as Version from '../../../main/ts/core/Version';
import * as Git from '../../../main/ts/utils/Git';
import { beehiveFlow, makeBranchWithPj, readPjVersionInDir, writeAndCommitFile } from './TestUtils';

describe('Release', () => {
  describe('updateVersion', () => {
    it('Updates versions', async () => {
      const check = async (input: string, expected: string) => {
        assert.equal(Version.versionToString(Release.updateVersion(await Version.parseVersion(input))), expected);
      };
      await check('0.0.0-rc', '0.0.0');
      await check('1.0.0-rc', '1.0.0');
      await check('0.300.100-rc', '0.300.100');
    });
  });

  describe('release', () => {
    const runScenario = async (branchName: string, version: string, arg: string) => {
      const hub = await Git.initInTempFolder(true);
      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await makeBranchWithPj(git, branchName, 'blah://frog', dir, 'test-release', version);
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

    it('fails to release when there are local un-pushed commits', async () => {
      const hub = await Git.initInTempFolder(true);
      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await makeBranchWithPj(git, 'main', 'blah://frog', dir, 'test-release', '0.0.1-rc');
      // create and commit a local file
      await writeAndCommitFile(git, dir, 'main', 'somefile.txt');
      await assert.isRejected(beehiveFlow([ 'release', 'main', '--working-dir', dir ]));
    });
  });
});
