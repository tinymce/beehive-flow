import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as getPort from 'get-port';
import { SimpleGit } from 'simple-git/promise';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import { versionToString } from '../../../main/ts/core/Version';

const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  if (a._tag === 'Some') {
    await Dispatch.dispatch(a.value);
  }
};

const getTags = (cwd: string, packageName: string): Record<string, string> => {
  const output = cp.execSync(`npm dist-tag ls @beehive-test/${packageName}`, { cwd }).toString();
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
  const hostAndPort = `127.0.0.1:${port}`;
  const verdaccio = cp.spawn('yarn', [ 'verdaccio', '--listen', hostAndPort, '--config', configFile ], { stdio: 'inherit' });

  const address = `http://${hostAndPort}`;
  return { port, verdaccio, address };
};

const writeNpmrc = async (address: string, dir: string): Promise<string> => {
  const npmrc = `@beehive-test:registry=${address}`;
  const npmrcFile = path.join(dir, '.npmrc');
  await Files.writeFile(npmrcFile, npmrc);
  return npmrcFile;
};

const publish = async (dryRun: boolean, dir: string): Promise<void> => {
  const dryRunArgs = dryRun ? [ '--dry-run' ] : [];
  await beehiveFlow([ 'publish', '--working-dir', dir, ...dryRunArgs ]);
};

// const assertGitTags = async (expectedTags: string[], git: SimpleGit): Promise<void> => {
//   assert.deepEqual((await git.tags()).all.sort(), expectedTags.sort());
// };

const makeBranchWithPj = async (git: SimpleGit, branchName: string, address: string, dir: string, packageName: string, version: string) => {
  await Git.checkoutNewBranch(git, branchName);
  const npmrcFile = await writeNpmrc(address, dir);
  const pjFile = path.join(dir, 'package.json');
  const pjContents = `
      {
        "name": "@beehive-test/${packageName}",
        "version": "${version}",
        "publishConfig": {
          "@beehive-test:registry": "${address}"
        }
      }`;
  await Files.writeFile(pjFile, pjContents);
  await git.add([ npmrcFile, pjFile ]);
  await git.commit('commit');
  await Git.push(git);
  return pjFile;
};

describe('Publish', () => {

  let verdaccio: cp.ChildProcess;
  let address: string;

  before(async () => {
    const v = await startVerdaccio();
    verdaccio = v.verdaccio;
    address = v.address;
  });

  after(() => {
    verdaccio.kill();
  });

  let scenario = 0;

  async function stamp(dir: string) {
    await beehiveFlow([ 'stamp', '--working-dir', dir ]);
  }

  const readPjVersion = async (pjFile: string): Promise<string> => {
    const pj = await PackageJson.parsePackageJsonFile(pjFile);
    const v = pj.version;
    if (v._tag !== 'Some') {
      throw new Error('Version should be some');
    }
    return versionToString(v.value);
  };

  const runScenario = async (branchName: string, version: string, dryRun: boolean) => {
    scenario++;
    const packageName = `scenario-${scenario}`;
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    // publish a dummy version, so we have something as "latest"
    await makeBranchWithPj(git, 'feature/dummy', address, dir, packageName, '0.0.1-rc');
    await publish(dryRun, dir);

    // publish the version we care about
    const pjFile = await makeBranchWithPj(git, branchName, address, dir, packageName, version);
    await stamp(dir);
    const stampedVersion = await readPjVersion(pjFile);
    await publish(dryRun, dir);
    const tags = getTags(dir, packageName);
    return { stampedVersion, tags, dir, git };
  };

  const TIMEOUT = 120000;

  it('publishes rc from main branch', async () => {
    const { stampedVersion, tags } = await runScenario('main', '0.1.0-rc', false);
    assert.deepEqual(tags, {
      latest: '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      main: stampedVersion,
      'rc-0.1': stampedVersion
    });
  }).timeout(TIMEOUT);

  it('publishes release from main branch', async () => {
    const { tags } = await runScenario('main', '0.1.0', false);
    assert.deepEqual(tags, {
      'feature-dummy': '0.0.1-rc',
      main: '0.1.0',
      latest: '0.1.0',
      'release-0.1': '0.1.0'
    });
  }).timeout(TIMEOUT);

  it('publishes rc from release branch', async () => {
    const { stampedVersion, tags } = await runScenario('release/0.5', '0.5.6-rc', false);
    assert.deepEqual(tags, {
      latest: '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'rc-0.5': stampedVersion
    });
  }).timeout(TIMEOUT);

  it('publishes release from release branch', async () => {
    const { tags } = await runScenario('release/0.5', '0.5.444', false);
    assert.deepEqual(tags, {
      'feature-dummy': '0.0.1-rc',
      latest: '0.5.444',
      'release-0.5': '0.5.444'
    });
  }).timeout(TIMEOUT);

  it('publishes from from feature branch', async () => {
    const { stampedVersion, tags } = await runScenario('feature/blah', '0.5.444-frog', false);
    assert.deepEqual(tags, {
      latest: '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'feature-blah' : stampedVersion
    });
  }).timeout(TIMEOUT);

  it('publishes from from hotfix branch', async () => {
    const { stampedVersion, tags } = await runScenario('hotfix/blah', '0.5.444-frog', false);
    assert.deepEqual(tags, {
      latest: '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'hotfix-blah' : stampedVersion
    });
  }).timeout(TIMEOUT);

  it('publishes from from spike branch', async () => {
    const { stampedVersion, tags } = await runScenario('spike/blah', '0.5.11-frog', false);
    assert.deepEqual(tags, {
      latest: '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'spike-blah' : stampedVersion
    });
  }).timeout(TIMEOUT);

  it('publishes from dist-dir', async () => {

    const hub = await Git.initInTempFolder(true);

    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    await Git.checkoutNewBranch(git, 'release/1.1');

    const npmrcFile = await writeNpmrc(address, dir);

    const pjFile = path.join(dir, 'package.json');

    const pjContents = `
      {
        "name": "@beehive-test/beehive-test-dist-dir",
        "version": "1.1.3",
        "publishConfig": {
          "@beehive-test:registry": "${address}"
        },
        "dependencies": {
          "@tinymce/tinymce-react": "3.8.4"
        }
      }`;
    await Files.writeFile(pjFile, pjContents);

    // sanity check that reading the dependencies works
    const readPj = await PackageJson.parsePackageJsonFile(pjFile);
    assert.deepEqual(readPj.other.dependencies, { '@tinymce/tinymce-react': '3.8.4' });

    fs.mkdirSync(path.join(dir, 'mydist'));

    const pjDistFile = path.join(dir, 'mydist', 'package.json');
    const pjDistContents = `
      {
        "name": "@beehive-test/beehive-test-dist-dir",
        "version": "1.1.3",
        "publishConfig": {
          "@beehive-test:registry": "${address}"
        },
        "dependencies": {}
      }`;
    await Files.writeFile(pjDistFile, pjDistContents);

    await git.add([ npmrcFile, pjFile, pjDistFile ]);
    await git.commit('blah');
    await Git.push(git);

    await beehiveFlow([ 'publish', '--working-dir', dir, '--dist-dir', 'mydist' ]);

    const downstream = await Files.tempFolder();
    await writeNpmrc(address, downstream);
    cp.execSync('npm add @beehive-test/beehive-test-dist-dir@1.1.3', { cwd: downstream });

    const depPj = await PackageJson.parsePackageJsonFileInFolder(path.join(downstream, 'node_modules', '@beehive-test', 'beehive-test-dist-dir'));

    assert.deepEqual(depPj.other.dependencies, {});
  }).timeout(120000); // Verdaccio runs pretty slowly on the build servers
});
