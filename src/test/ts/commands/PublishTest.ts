import * as cp from 'child_process';
import * as path from 'path';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as getPort from 'get-port';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';

const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  await Dispatch.dispatch(a);
};

const getTags = (cwd: string): Record<string, string> => {
  const output = cp.execSync('npm dist-tag ls @beehive-test/beehive-test', { cwd }).toString();
  const lines = output.split('\n').filter((x) => x.length > 0);
  const r: Record<string, string> = {};

  for (const line of lines) {
    const [ tag, version ] = line.split(': ');
    r[tag] = version;
  }
  return r;
};

const startVerdaccio = async () => {
  const configDir = await Files.tempFolder();
  const config = `
storage: ${configDir}/storage
packages:
  '@beehive-test/*':
    access: $anonymous
    publish: $anonymous
    proxy: npmjs
web:
  enable: false
`;
  const configFile = path.join(configDir, 'config.yml');
  await Files.writeFile(configFile, config);

  const port = await getPort();
  const verdaccio = cp.spawn('yarn', [ 'verdaccio', '--listen', String(port), '--config', configFile ], { stdio: 'inherit' });
  return { port, verdaccio };
};

const publish = async (dir: string, dryRun: boolean): Promise<void> => {
  const dryRunArgs = dryRun ? [ '--dry-run' ] : [];
  await beehiveFlow([ 'publish', '--working-dir', dir, ...dryRunArgs ]);
};

const writeNpmrc = async (port: number, dir: string): Promise<string> => {
  const npmrc = `@beehive-test:registry=http://0.0.0.0:${port}/`;
  const npmrcFile = path.join(dir, '.npmrc');
  await Files.writeFile(npmrcFile, npmrc);
  return npmrcFile;
};

describe('Publish', () => {
  it('publishes', async () => {
    const { port, verdaccio } = await startVerdaccio();

    try {
      const featureBranch = 'feature/TINY-BLAH';

      const hub = await Git.initInTempFolder(true);

      const { dir, git } = await Git.cloneInTempFolder(hub.dir);
      await Git.checkoutNewBranch(git, featureBranch);

      const npmrcFile = await writeNpmrc(port, dir);

      const pjFile = path.join(dir, 'package.json');

      const go = async (version: string, dryRun: boolean) => {
        const pj = `
        {
          "name": "@beehive-test/beehive-test",
          "version": "${version}",
          "publishConfig": {
            "@beehive-test:registry": "http://0.0.0.0:${port}/"
          }
        }`;
        await Files.writeFile(pjFile, pj);
        await git.add([ npmrcFile, pjFile ]);
        await git.commit('commit');
        await Git.pushNewBranch(git);
        await publish(dir, dryRun);
        return getTags(dir);
      };

      // PUBLISH 1 - feature branch
      // NOTE: first publish always ends up tagged latest
      const tags1 = await go('0.1.0-alpha', false);
      assert.deepEqual(tags1, { latest: '0.1.0-alpha', [ featureBranch ]: '0.1.0-alpha' });

      // PUBLISH 2 - feature branch
      const tags2 = await go('0.2.0-alpha', false);
      assert.deepEqual(tags2, { latest: '0.1.0-alpha', [ featureBranch ]: '0.2.0-alpha' });

      // PUBLISH 3 - dry-run
      const tags3 = await go('0.3.0-alpha', true);
      assert.deepEqual(tags3, { latest: '0.1.0-alpha', [ featureBranch ]: '0.2.0-alpha' });

      // PUBLISH 4 - release state
      await Git.checkoutNewBranch(git, 'release/0.1');
      const tags4 = await go('0.1.0', false);
      assert.deepEqual(tags4, { 'latest': '0.1.0', [ featureBranch ]: '0.2.0-alpha', 'release/0.1': '0.1.0' });

      // PUBLISH 5 - next release
      await Git.checkoutNewBranch(git, 'release/0.2');
      const tags5 = await go('0.2.0', false);
      assert.deepEqual(tags5, { 'latest': '0.2.0', [ featureBranch ]: '0.2.0-alpha', 'release/0.1': '0.1.0', 'release/0.2': '0.2.0' });

      // PUBLISH 6 - re-release 0.1
      await git.checkout('release/0.1');
      const tags6 = await go('0.1.1', false);
      assert.deepEqual(tags6, { 'latest': '0.2.0', [ featureBranch ]: '0.2.0-alpha', 'release/0.1': '0.1.1', 'release/0.2': '0.2.0' });

    } finally {
      verdaccio.kill();
    }
  }).timeout(20000);
});
