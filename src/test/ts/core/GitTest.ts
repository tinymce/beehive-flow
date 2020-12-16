import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as Git from '../../../main/ts/utils/Git';
import * as ArrayUtils from '../../../main/ts/utils/ArrayUtils';

type TempGit = Git.TempGit;

const assert = chai.use(chaiAsPromised).assert;

const createBranch = async ({ dir, git }: TempGit, branchName: string): Promise<void> => {
  await Git.checkoutNewBranch(git, branchName);
  const foofile = path.join(dir, 'foo');
  fs.writeFileSync(foofile, 'cat cat');
  await git.add(foofile);
  await git.commit('initial');
  await Git.pushExplicitAndSetUpstream(git);
};

describe('Git', () => {
  describe('remoteBranches', () => {
    it('gets remote branches', async () => {

      const check = async (branchNames: string[]): Promise<void> => {
        const hub = await Git.initInTempFolder(true);

        const main = await Git.cloneInTempFolder(hub.dir);
        for (const branch of branchNames) {
          await createBranch(main, branch);
        }

        const test = await Git.cloneInTempFolder(hub.dir);
        const branches = await Git.remoteBranchNames(test.git);
        const actual = ArrayUtils.sort(branches);

        assert.deepEqual(ArrayUtils.sort(actual), ArrayUtils.sort(branchNames));
      };

      await check([ 'cat' ]);
      await check([ 'cat', 'frog', 'chicken' ]);
      await check([]);
      await check([ 'zingo', 'release/1.2' ]);
    });
  });
});