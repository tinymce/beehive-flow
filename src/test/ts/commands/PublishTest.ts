import * as cp from 'child_process';
import * as path from 'path';
import { describe, it } from 'mocha';
import * as getPort from 'get-port';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';

// import * as chai from 'chai';
// import * as chaiAsPromised from 'chai-as-promised';
// const assert = chai.use(chaiAsPromised).assert;
//
// const delay = (n: number): Promise<void> => new Promise((resolve) => {
//   setTimeout(() => {
//     resolve();
//   }, n);
// });

const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  await Dispatch.dispatch(a);
};

describe('blah', () => {
  it('blahs', async () => {

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

    try {
      const working = await Git.initInTempFolder(false);
      await Git.checkoutNewBranch(working.git, 'feature/TINY-BLAH');

      const npmrc = `@beehive-test:registry=http://0.0.0.0:${port}/`;
      const npmrcFile = path.join(working.dir, '.npmrc');
      await Files.writeFile(npmrcFile, npmrc);

      const pj = `
      {
        "name": "@beehive-test/beehive-test",
        "version": "1.2.3",
        "publishConfig": {
          "@beehive-test:registry": "http://0.0.0.0:${port}/"
        }
      }`;

      const pjFile = path.join(working.dir, 'package.json');
      await Files.writeFile(pjFile, pj);

      await working.git.add([ npmrcFile, pjFile ]);
      await working.git.commit('feature branch');

      await beehiveFlow([ 'publish', '--working-dir', working.dir ]);

      // TODO: validate that the tag worked
      // TODO: test with a release version and check the second tag

      // TODO: It seems to be ignoring the tag and just using "latest"
      cp.execSync('npm dist-tag ls @beehive-test/beehive-test', { stdio: 'inherit', cwd: working.dir });

    } finally {
      verdaccio.kill();
    }
  }).timeout(20000);
});