import * as path from 'path';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import fc from 'fast-check';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import { BranchDetails, BranchState, BranchType, getReleaseBranchName, versionFromReleaseBranch, getBranchDetails } from '../../../main/ts/core/BranchLogic';
import * as Git from '../../../main/ts/utils/Git';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';
import * as Files from '../../../main/ts/utils/Files';

type PackageJson = PackageJson.PackageJson;

const assert = chai.use(chaiAsPromised).assert;

describe('BranchLogic', () => {
  describe('releaseBranchName', () => {
    it('makes branch names (manual cases)', () => {
      assert.equal(getReleaseBranchName({ major: 1, minor: 2 }), 'release/1.2');
      assert.equal(getReleaseBranchName({ major: 0, minor: 0 }), 'release/0.0');
    });
    it('makes branch names (property)', () => {
      fc.assert(fc.property(fc.nat(1000), fc.nat(1000), (major, minor) => {
        assert.equal(getReleaseBranchName({ major, minor }), `release/${major}.${minor}`);
      }));
    });
  });

  describe('versionFromReleaseBranch', () => {
    it('parses versions', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(1000), fc.nat(1000), async (major, minor) => {
        await assert.becomes(
          versionFromReleaseBranch(`release/${major}.${minor}`),
          { major, minor }
        );
      }));
    });
  });

  describe('inspectRepo', () => {

    const setup = async (branchName: string, sVersion: string) => {
      const version = await Version.parseVersion(sVersion);

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
      await assert.isRejected(getBranchDetails(dir));
    });

    it('fails if dir is not at the root of a git repo', async () => {
      const { dir } = await Git.initInTempFolder();
      const subbie = path.join(dir, 'subbie');
      fs.mkdirSync(subbie);
      await assert.isRejected(getBranchDetails(subbie));
    });

    it('detects valid main branch', async () => {
      const { dir, packageJsonFile, version, packageJson } = await setup('main', '0.6.0-alpha');

      const expected: BranchDetails = {
        packageJsonFile,
        packageJson,
        version,
        currentBranch: 'main',
        branchType: BranchType.Main,
        branchState: BranchState.Main
      };

      await assert.becomes(getBranchDetails(dir), expected);
    });

    it('fails for main branch with wrong minor version', async () => {
      const { dir } = await setup('main', '0.6.1-alpha');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('fails for main branch with rc version', async () => {
      const { dir } = await setup('main', '0.6.0-rc');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('fails for main branch with release version', async () => {
      const { dir } = await setup('main', '0.6.0');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('fails for main branch with buildmetadata', async () => {
      const { dir } = await setup('main', '0.6.0+9nesste123.frog');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('detects valid feature branch', async () => {
      const { dir, packageJsonFile, version, packageJson } = await setup('feature/BLAH-1234', '0.6.0-alpha');

      const expected: BranchDetails = {
        packageJsonFile,
        packageJson,
        version,
        currentBranch: 'feature/BLAH-1234',
        branchType: BranchType.Feature,
        branchState: BranchState.Feature
      };

      await assert.becomes(getBranchDetails(dir), expected);
    });

    it('detects valid spike branch', async () => {
      const { dir, packageJsonFile, version, packageJson } = await setup('spike/BLAH-1234', '0.6.0-alpha');

      const expected: BranchDetails = {
        packageJsonFile,
        packageJson,
        version,
        currentBranch: 'spike/BLAH-1234',
        branchType: BranchType.Spike,
        branchState: BranchState.Spike
      };

      await assert.becomes(getBranchDetails(dir), expected);
    });

    // TODO: test other states
  });
});
