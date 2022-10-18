import { describe, it } from 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import * as Git from '../../../main/ts/utils/Git';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';
import { beehiveFlow, makeBranchWithPj } from './TestUtils';

const assert = chai.use(chaiAsPromised).assert;

describe('Lifecycle', () => {
  it('cycles', async () => {
    const hub = await Git.initInTempFolder(true);

    const { dir, git } = await Git.cloneInTempFolder(hub.dir, O.none);
    await makeBranchWithPj(git, 'main', dir, 'lifecycle-test', '0.1.0-rc');

    const assertPjVersion = async (expected: string) => {
      const pj = await PackageJson.parsePackageJsonFileInFolder(dir);
      assert.deepEqual(pj.version, await Version.parseVersion(expected));
    };

    await beehiveFlow([ 'prepare', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.2.0-rc');

    await git.checkout('release/0.1');
    await assertPjVersion('0.1.0-rc');

    await beehiveFlow([ 'release', '0.1', '--yes', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.0');

    await beehiveFlow([ 'advance', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.1-rc');

    await beehiveFlow([ 'release', '0.1', '--yes', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.1');

    await beehiveFlow([ 'advance', '0.1', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.1.2-rc');
  }).timeout(45000); // this test is doing a lot, so it can be a bit slow
});
