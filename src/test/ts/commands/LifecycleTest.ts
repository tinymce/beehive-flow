import * as path from 'path';
import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import * as Git from '../../../main/ts/utils/Git';
import * as Files from '../../../main/ts/utils/Files';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';

const assert = chai.use(chaiAsPromised).assert;

const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  await Dispatch.dispatch(a);
};

describe('Lifecycle', () => {
  it('cycles', async () => {
    const hub = await Git.initInTempFolder(true);

    const { dir, git } = await Git.cloneInTempFolder(hub.dir, O.none);
    await Git.checkoutNewBranch(git, 'main');
    await Files.writeFile(path.join(dir, 'package.json'), `
    {
      "version": "0.1.0-alpha"
    }
    `);

    await git.add('package.json');
    await git.commit('Initial');
    await Git.pushNewBranch(git);

    const assertPjVersion = async (expected: string) => {
      const pj = await PackageJson.parsePackageJsonFileInFolder(dir);
      assert.deepEqual(pj.version, O.some(Version.parseVersionOrThrow(expected)));
    };

    await beehiveFlow([ 'prepare', '--git-url', hub.dir ]);
    await git.pull();
    await assertPjVersion('0.2.0-alpha');

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
  });
});
