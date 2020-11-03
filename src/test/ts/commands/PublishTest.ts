import * as cp from 'child_process';
import * as path from 'path';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as getPort from 'get-port';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';

type TempGit = Git.TempGit;

const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  await Dispatch.dispatch(a);
};

const getTags = function (working: TempGit): Record<string, string> {
  const output = cp.execSync('npm dist-tag ls @beehive-test/beehive-test', { cwd: working.dir }).toString();
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

describe('Publish', () => {
  it('publishes', async () => {
    const { port, verdaccio } = await startVerdaccio();

    try {
      const branchName = 'feature/TINY-BLAH';

      const working = await Git.initInTempFolder(false);
      await Git.checkoutNewBranch(working.git, branchName);

      const npmrc = `@beehive-test:registry=http://0.0.0.0:${port}/`;
      const npmrcFile = path.join(working.dir, '.npmrc');
      await Files.writeFile(npmrcFile, npmrc);

      const pjFile = path.join(working.dir, 'package.json');

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
        await working.git.add([ npmrcFile, pjFile ]);
        await working.git.commit('commit');
        await publish(working.dir);
        return getTags(working);
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
