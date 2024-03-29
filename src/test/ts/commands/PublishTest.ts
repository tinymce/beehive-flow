import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as TestUtils from './TestUtils';

const publish = async (dryRun: boolean, dir: string): Promise<void> => {
  const dryRunArgs = dryRun ? [ '--dry-run' ] : [];
  await TestUtils.beehiveFlow([ 'publish', '--working-dir', dir, ...dryRunArgs ]);
};

describe('Publish', () => {

  let verdaccio: cp.ChildProcess;
  let address: string;

  before(async () => {
    const v = await TestUtils.startVerdaccio();
    verdaccio = v.verdaccio;
    address = v.address;
  });

  after(() => {
    verdaccio.kill();
  });

  let scenario = 0;

  const stamp = async (dir: string) => {
    await TestUtils.beehiveFlow([ 'stamp', '--working-dir', dir ]);
  };

  const runScenario = async (branchName: string, version: string, dryRun: boolean, f: (dir: string) => Promise<void>) => {
    scenario++;
    const packageName = `scenario-${scenario}`;
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    // publish a dummy version, so we have something as "latest"
    await TestUtils.makeBranchWithPj(git, 'feature/dummy', dir, packageName, '0.0.1-rc', undefined, {}, address);
    await publish(dryRun, dir);

    // publish the version we care about
    const pjFile = await TestUtils.makeBranchWithPj(git, branchName, dir, packageName, version, undefined, {}, address);
    await stamp(dir);
    const stampedVersion = await TestUtils.readPjVersion(pjFile);
    await f(dir);
    await publish(dryRun, dir);
    const npmTags = await TestUtils.getNpmTags(dir, packageName);
    const gitTags = (await git.tags()).all.sort();
    return { stampedVersion, npmTags, dir, git, gitTags, packageName };
  };

  const runNormalScenario = async (branchName: string, version: string, dryRun: boolean) =>
    runScenario(branchName, version, dryRun, () => Promise.resolve());

  const TIMEOUT = 120000;

  it('publishes rc from main branch', async () => {
    const { stampedVersion, npmTags, gitTags } = await runNormalScenario('main', '0.1.0-rc', false);
    assert.deepEqual(npmTags, {
      'latest': stampedVersion,
      'feature-dummy': '0.0.1-rc',
      'main': stampedVersion,
      'rc-0.1': stampedVersion
    });
    assert.deepEqual(gitTags, []);
  }).timeout(TIMEOUT);

  it('publishes release from main branch', async () => {
    const { npmTags, gitTags } = await runNormalScenario('main', '0.1.0', false);
    assert.deepEqual(npmTags, {
      'feature-dummy': '0.0.1-rc',
      'main': '0.1.0',
      'latest': '0.1.0',
      'release-0.1': '0.1.0'
    });
    assert.deepEqual(gitTags, [ '0.1.0' ]);
  }).timeout(TIMEOUT);

  it('publishes rc from release branch', async () => {
    const { stampedVersion, npmTags, gitTags } = await runNormalScenario('release/0.5', '0.5.6-rc', false);
    assert.deepEqual(npmTags, {
      'latest': stampedVersion,
      'feature-dummy': '0.0.1-rc',
      'rc-0.5': stampedVersion
    });
    assert.deepEqual(gitTags, []);
  }).timeout(TIMEOUT);

  it('publishes release from release branch', async () => {
    const { npmTags, gitTags } = await runNormalScenario('release/0.5', '0.5.444', false);
    assert.deepEqual(npmTags, {
      'feature-dummy': '0.0.1-rc',
      'latest': '0.5.444',
      'release-0.5': '0.5.444'
    });
    assert.deepEqual(gitTags, [ '0.5.444' ]);
  }).timeout(TIMEOUT);

  it('publishes from feature branch', async () => {
    const { stampedVersion, npmTags, gitTags } = await runNormalScenario('feature/blah', '0.5.444-frog', false);
    assert.deepEqual(npmTags, {
      'latest': '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'feature-blah': stampedVersion
    });
    assert.deepEqual(gitTags, []);
  }).timeout(TIMEOUT);

  it('publishes from hotfix branch', async () => {
    const { stampedVersion, npmTags, gitTags } = await runNormalScenario('hotfix/blah', '0.5.444-frog', false);
    assert.deepEqual(npmTags, {
      'latest': '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'hotfix-blah': stampedVersion
    });
    assert.deepEqual(gitTags, []);
  }).timeout(TIMEOUT);

  it('publishes from spike branch', async () => {
    const { stampedVersion, npmTags, gitTags } = await runNormalScenario('spike/blah', '0.5.11-frog', false);
    assert.deepEqual(npmTags, {
      'latest': '0.0.1-rc',
      'feature-dummy': '0.0.1-rc',
      'spike-blah': stampedVersion
    });
    assert.deepEqual(gitTags, []);
  }).timeout(TIMEOUT);

  it('publishes from dist-dir', async () => {

    const hub = await Git.initInTempFolder(true);

    const { dir, git } = await Git.cloneInTempFolder(hub.dir);

    await Git.checkoutNewBranch(git, 'release/1.1');

    const npmrcFile = await TestUtils.writeNpmrc(address, dir);

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
    assert.deepEqual(readPj.dependencies, { '@tinymce/tinymce-react': '3.8.4' });

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

    await TestUtils.beehiveFlow([ 'publish', '--working-dir', dir, '--dist-dir', 'mydist/' ]);

    const downstream = await Files.tempFolder();
    await TestUtils.writeNpmrc(address, downstream);
    cp.execSync('npm add @beehive-test/beehive-test-dist-dir@1.1.3', { cwd: downstream });

    const depPj = await PackageJson.parsePackageJsonFileInFolder(path.join(downstream, 'node_modules', '@beehive-test', 'beehive-test-dist-dir'));

    assert.deepEqual(depPj.dependencies, {});

    const gitTags = (await git.tags()).all.sort();
    assert.deepEqual(gitTags, [ '1.1.3' ]);
  }).timeout(120000); // Verdaccio runs pretty slowly on the build servers

  it('fails to publish a feature branch if the changelog sections type do not match the release', async () => {
    await assert.isRejected(runScenario('feature/blah', '0.5.11-frog', false, async (dir) => {
      const changelogFile = path.join(dir, 'CHANGELOG.md');
      await Files.writeFile(changelogFile, `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Added entry
`);
    }));
  }).timeout(TIMEOUT);

  it('fails to publish a release branch if the changelog sections type do not match the release', async () => {
    await assert.isRejected(runScenario('feature/blah', '1.3.12', false, async (dir) => {
      const changelogFile = path.join(dir, 'CHANGELOG.md');
      await Files.writeFile(changelogFile, `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Improved
- Improved entry
`);
    }));
  }).timeout(TIMEOUT);
});
