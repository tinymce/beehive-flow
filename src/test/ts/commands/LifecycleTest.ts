import * as path from 'path';
import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import * as Git from '../../../main/ts/utils/Git';
import * as Files from '../../../main/ts/utils/Files';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';
import { beehiveFlow } from './TestUtils';

const assert = chai.use(chaiAsPromised).assert;

describe('Lifecycle', () => {
  it('cycles', async () => {
    const hub = await Git.initInTempFolder(true);

    const { dir, git } = await Git.cloneInTempFolder(hub.dir, O.none);
    await Git.checkoutNewBranch(git, 'main');
    await Files.writeFile(path.join(dir, 'package.json'), `
    {
      "name": "@beehive-test/lifecycle-test",
      "version": "0.1.0-rc"
    }
    `);

    await git.add('package.json');
    await git.commit('Initial');
    await Git.push(git);

    const assertPjVersion = async (expected: string) => {
      const pj = await PackageJson.parsePackageJsonFileInFolder(dir);
      assert.deepEqual(pj.version, await Version.parseVersion(expected));
    };

    await beehiveFlow([ 'prepare', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.2.0-rc');

    await git.checkout('release/0.1');
    await assertPjVersion('0.1.0-rc');

    await beehiveFlow([ 'release', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.0');

    await beehiveFlow([ 'advance', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.1-rc');

    await beehiveFlow([ 'release', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.1');

    await beehiveFlow([ 'advance', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.2-rc');
  }).timeout(45000); // this test is doing a lot, so it can be a bit slow
});
