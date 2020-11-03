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

const publish = async (dir: string): Promise<void> => {
  await beehiveFlow([ 'publish', '--working-dir', dir ]);
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
      const branchName = 'feature/TINY-BLAH';

      const { dir, git } = await Git.initInTempFolder(false);
      await Git.checkoutNewBranch(git, branchName);

      const npmrcFile = await writeNpmrc(port, dir);

      const pjFile = path.join(dir, 'package.json');

      const go = async (version: string) => {
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
        await publish(dir);
        return getTags(dir);
      };

      const version1 = `0.1.0-alpha`;
      const tags1 = await go(version1);

      // NOTE: first publish always ends up tagged latest
      assert.deepEqual(tags1, { latest: version1, [ branchName ]: version1 });

      const version2 = `0.2.0-alpha`;
      const tags2 = await go(version2);
      assert.deepEqual(tags2, { latest: version1, [ branchName ]: version2 });

    } finally {
      verdaccio.kill();
    }
  }).timeout(20000);
});
