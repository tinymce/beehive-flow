import * as path from 'path';
import { describe, it } from 'mocha';
import fc from 'fast-check';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import * as BranchLogic from '../../../main/ts/core/BranchLogic';
import * as Git from '../../../main/ts/utils/Git';
import * as RepoState from '../../../main/ts/core/RepoState';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';
import * as Files from '../../../main/ts/utils/Files';

type RepoState = RepoState.RepoState;
type PackageJson = PackageJson.PackageJson;

const assert = chai.use(chaiAsPromised).assert;

describe('BranchLogic', () => {
  describe('releaseBranchName', () => {
    it('makes branch names (manual cases)', () => {
      assert.equal(BranchLogic.releaseBranchName({ major: 1, minor: 2 }), 'release/1.2');
      assert.equal(BranchLogic.releaseBranchName({ major: 0, minor: 0 }), 'release/0.0');
    });
    it('makes branch names (property)', () => {
      fc.assert(fc.property(fc.nat(1000), fc.nat(1000), (major, minor) => {
        assert.equal(BranchLogic.releaseBranchName({ major, minor }), `release/${major}.${minor}`);
      }));
    });
  });

  describe('versionFromReleaseBranch', () => {
    it('parses versions', () => {
      fc.assert(fc.asyncProperty(fc.nat(1000), fc.nat(1000), async (major, minor) => {
        await assert.becomes(
          BranchLogic.versionFromReleaseBranch(`release/${major}.${minor}`),
          { major, minor }
        );
      }));
    });
  });

  describe('detectRepoState', () => {

    const setup = async (branchName: string, sVersion: string) => {
      const version = Version.parseVersionOrThrow(sVersion);

      const hub = await Git.initInTempFolder(true);
      const gitUrl = hub.dir;
      const { dir, git } = await Git.cloneInTempFolder(gitUrl);
      await Git.checkoutNewBranch(git, branchName);
      const packageJsonFile = path.join(dir, 'package.json');

      const packageJson: PackageJson = {
        version: O.some(version),
        other: {}
      };

      await PackageJson.writePackageJsonFile(packageJsonFile, packageJson);
      await git.add(packageJsonFile);
      await git.commit('commit');
      return { gitUrl, dir, packageJsonFile, version, packageJson };
    };

    it('fails if dir is not a git repo', async () => {
      const dir = await Files.tempFolder();
      await assert.isRejected(BranchLogic.detectRepoState(dir));
    });

    it('fails if dir is not at the root of a git repo', async () => {
      const { dir } = await Git.initInTempFolder();
      const subbie = path.join(dir, 'subbie');
      await Files.mkdir(subbie);
      await assert.isRejected(BranchLogic.detectRepoState(subbie));
    });

    it('detects valid main branch', async () => {
      const { gitUrl, dir, packageJsonFile, version, packageJson } = await setup('main', '0.6.0-alpha');

      const expected: RepoState = {
        kind: 'Main',
        packageJsonFile,
        packageJson,
        version,
        gitUrl,
        currentBranch: 'main',
        majorMinorVersion: Version.toMajorMinor(version)
      };

      await assert.becomes(BranchLogic.detectRepoState(dir), expected);
    });

    it('fails for main branch with wrong minor version', async () => {
      const { dir } = await setup('main', '0.6.1-alpha');
      await assert.isRejected(BranchLogic.detectRepoState(dir));
    });

    it('fails for main branch with rc version', async () => {
      const { dir } = await setup('main', '0.6.0-rc');
      await assert.isRejected(BranchLogic.detectRepoState(dir));
    });

    it('fails for main branch with release version', async () => {
      const { dir } = await setup('main', '0.6.0');
      await assert.isRejected(BranchLogic.detectRepoState(dir));
    });

    it('fails for main branch with buildmetadata', async () => {
      const { dir } = await setup('main', '0.6.0+9nesste123.frog');
      await assert.isRejected(BranchLogic.detectRepoState(dir));
    });

    it('detects valid feature branch', async () => {
      const { gitUrl, dir, packageJsonFile, version, packageJson } = await setup('feature/BLAH-1234', '0.6.0-alpha');

      const expected: RepoState = {
        kind: 'Feature',
        packageJsonFile,
        packageJson,
        version,
        gitUrl,
        currentBranch: 'feature/BLAH-1234',
        majorMinorVersion: Version.toMajorMinor(version),
        code: 'BLAH-1234'
      };

      await assert.becomes(BranchLogic.detectRepoState(dir), expected);
    });

    it('detects valid spike branch', async () => {
      const { gitUrl, dir, packageJsonFile, version, packageJson } = await setup('spike/BLAH-1234', '0.6.0-alpha');

      const expected: RepoState = {
        kind: 'Spike',
        packageJsonFile,
        packageJson,
        version,
        gitUrl,
        currentBranch: 'spike/BLAH-1234',
        majorMinorVersion: Version.toMajorMinor(version),
        code: 'BLAH-1234'
      };

      await assert.becomes(BranchLogic.detectRepoState(dir), expected);
    });

    // TODO: test other states
  });
});
