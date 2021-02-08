import * as path from 'path';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import fc from 'fast-check';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as O from 'fp-ts/Option';
import {
  BranchDetails, BranchState, BranchType, getBranchDetails, getReleaseBranchName, versionFromReleaseBranch
} from '../../../main/ts/core/BranchLogic';
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

  describe('getBranchDetails', () => {

    const setup = async (branchName: string, sVersion: string) => {
      const version = await Version.parseVersion(sVersion);

      const hub = await Git.initInTempFolder(true);
      const gitUrl = hub.dir;
      const { dir, git } = await Git.cloneInTempFolder(gitUrl);
      await Git.checkoutNewBranch(git, branchName);
      const packageJsonFile = path.join(dir, 'package.json');

      const packageJson: PackageJson = {
        name: '@beehive-test/dummypackage',
        version: O.some(version),
        workspaces: O.none,
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

    const check = async (currentBranch: string, sVersion: string, branchType: BranchType, branchState: BranchState): Promise<void> => {
      const { dir, packageJsonFile, version, packageJson } = await setup(currentBranch, sVersion);

      const expected: BranchDetails = {
        packageJsonFile,
        packageJson,
        version,
        currentBranch,
        branchType,
        branchState
      };

      await assert.becomes(getBranchDetails(dir), expected);
    };

    it('passes for main branch with rc version', () =>
      check('main', '0.6.0-rc', BranchType.Main, BranchState.ReleaseCandidate)
    );

    it('passes for timestamped version on main branch', () =>
      check('main', '0.6.0-rc.20020202020202.293la9', BranchType.Main, BranchState.ReleaseCandidate)
    );

    it('fails for main branch with wrong minor version', async () => {
      const { dir } = await setup('main', '0.6.1-alpha');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('fails for main branch with alpha version', async () => {
      const { dir } = await setup('main', '0.6.0-alpha');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('passes for main branch with release version', async () =>
      check('main', '0.6.0', BranchType.Main, BranchState.ReleaseReady)
    );

    it('fails for main branch with non-rc prerelease version', async () => {
      const { dir } = await setup('main', '0.6.0+9nesste123.frog');
      await assert.isRejected(getBranchDetails(dir));
    });

    it('detects valid feature branch', () =>
      check('feature/BLAH-1234', '0.6.0-alpha', BranchType.Feature, BranchState.Feature)
    );

    it('detects valid spike branch', () =>
      check('spike/BLAH-1234', '0.6.0-alpha', BranchType.Spike, BranchState.Spike)
    );

    it('detects valid feature branch', () =>
      check('feature/BLAH-ab3', '0.6.0-alpha', BranchType.Feature, BranchState.Feature)
    );

    it('passes for timestamped version on feature branch', () =>
      check('feature/98qenaoects', '0.6.0-alpha.20020202020202.293la9', BranchType.Feature, BranchState.Feature)
    );

    it('detects valid rc state', () =>
      check('release/8.1298', '8.1298.7-rc', BranchType.Release, BranchState.ReleaseCandidate)
    );

    it('passes for timestamped version in rc state', () =>
      check('release/9189382.88', '9189382.88.12-rc.20020202020202.293la9', BranchType.Release, BranchState.ReleaseCandidate)
    );

    it('detects valid release state', () =>
      check('release/8.1298', '8.1298.7', BranchType.Release, BranchState.ReleaseReady)
    );
  });
});
