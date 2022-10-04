import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as Git from '../../../main/ts/utils/Git';
import { beehiveFlow, makeBranchWithPj, readKeepAChangelogInDir, readPjVersionInDir, writeAndAddLocalFile } from './TestUtils';

describe('Release', () => {
  const runScenario = async (
    branchName: string,
    version: string,
    arg: string,
    newVersion?: string,
    dependencies: Record<string, string> = {},
    additionalArgs: string[] = []
  ) => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);
    await makeBranchWithPj(git, branchName, dir, 'test-release', version, newVersion, dependencies);
    await beehiveFlow([ 'release', arg, '--working-dir', dir, ...additionalArgs ]);
    await git.pull();
    return dir;
  };

  it('releases rc version from main', async () => {
    const dir = await runScenario('main', '0.0.1-rc', 'main');
    await assert.becomes(readPjVersionInDir(dir), '0.0.1');
  });

  it('releases rc version from release branch', async () => {
    const dir = await runScenario('release/88.1', '88.1.9-rc', '88.1');
    await assert.becomes(readPjVersionInDir(dir), '88.1.9');
  });

  it('fails to release when a dependency still uses a pre-release version', async () => {
    const result = runScenario('main', '0.1.0-rc', 'main', undefined, { dep1: '~3.2.0-rc' });
    await assert.isRejected(result, 'Pre-release versions were found for: dep1');
  });

  it('releases if --allow-pre-releases is enabled when a pre-release dependency exists', async () => {
    const dir = await runScenario('main', '0.1.0-rc', 'main', undefined, { dep1: '~3.2.0-rc' }, [ '--allow-pre-releases' ]);
    await assert.becomes(readPjVersionInDir(dir), '0.1.0');
  });

  it('fails to release when the working directory is dirty', async () => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);
    await makeBranchWithPj(git, 'main', dir, 'test-release', '0.0.1-rc');
    await git.checkout([ 'main' ]);
    // create a local file
    await writeAndAddLocalFile(git, dir, 'file.text');
    await assert.isRejected(beehiveFlow([ 'release', 'main', '--working-dir', dir ]));
  });

  it('fails to release when there are local un-pushed commits', async () => {
    const hub = await Git.initInTempFolder(true);
    const { dir, git } = await Git.cloneInTempFolder(hub.dir);
    await makeBranchWithPj(git, 'main', dir, 'test-release', '0.0.1-rc');
    await git.checkout([ 'main' ]);
    // create and commit a local file
    await writeAndAddLocalFile(git, dir, 'file.text');
    await git.commit('commit msg');
    await assert.isRejected(beehiveFlow([ 'release', 'main', '--working-dir', dir ]));
  });

  it('Adds the changelog version and date', async () => {
    const dir = await runScenario('main', '0.2.0-rc', 'main');
    await assert.becomes(readPjVersionInDir(dir), '0.2.0');
    const changelog = await readKeepAChangelogInDir(dir);
    const unreleased = changelog.releases[0];
    const releaseSection = changelog.releases[1];
    assert.isTrue(unreleased.isEmpty(), 'Unreleased section exists and is empty');
    assert.isFalse(releaseSection.isEmpty(), 'Release section should not be empty');
    assert.equal(releaseSection.version?.compare('0.2.0'), 0);
    assert.equal(releaseSection.date?.getFullYear(), new Date().getFullYear());
    assert.equal(releaseSection.date?.getMonth(), new Date().getMonth());
    assert.equal(releaseSection.date?.getDate(), new Date().getDate());
  });

  it('Updates the changelog date if it already exists', async () => {
    const dir = await runScenario('main', '1.0.0-rc', 'main', '1.0.0');
    await assert.becomes(readPjVersionInDir(dir), '1.0.0');
    const changelog = await readKeepAChangelogInDir(dir);
    const releaseSection = changelog.releases[0];
    assert.isFalse(releaseSection.isEmpty(), 'Release section should not be empty');
    assert.equal(releaseSection.version?.compare('1.0.0'), 0);
    assert.equal(releaseSection.date?.getFullYear(), new Date().getFullYear());
    assert.equal(releaseSection.date?.getMonth(), new Date().getMonth());
    assert.equal(releaseSection.date?.getDate(), new Date().getDate());
  });
});
