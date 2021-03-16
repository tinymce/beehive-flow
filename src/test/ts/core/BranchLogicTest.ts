import * as path from 'path';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import fc from 'fast-check';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {
  BranchDetails,
  BranchState,
  BranchType,
  getBranchDetails,
  getReleaseBranchName,
  versionFromReleaseBranch
} from '../../../main/ts/core/BranchLogic';
import * as Git from '../../../main/ts/utils/Git';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import * as Version from '../../../main/ts/core/Version';
import * as Files from '../../../main/ts/utils/Files';

type PackageJson = PackageJson.PackageJson;

const assert = chai.use(chaiAsPromised).assert;

const newRepo = async (branchName: string) => {
  const hub = await Git.initInTempFolder(true);
  const gitUrl = hub.dir;
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  await Git.checkoutNewBranch(git, branchName);
  return { gitUrl, dir, git };
};

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
      const { gitUrl, dir, git } = await newRepo(branchName);
      const packageJsonFile = path.join(dir, 'package.json');

      const packageJson: PackageJson = {
        name: '@beehive-test/dummypackage',
        version,
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
        rootModule: {
          packageJsonFile,
          packageJson
        },
        version,
        currentBranch,
        branchType,
        branchState,
        workspacesEnabled: false,
        modules: {}
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

    context('workspaces', () => {
      it('reads modules', async () => {
        const { dir, git } = await newRepo('main');
        const rootPj = await PackageJson.decode({
          name: 'rootPackage',
          version: '1.2.3',
          private: true,
          workspaces: [ 'modules/*' ]
        });
        const rootPjFile = path.join(dir, 'package.json');
        await PackageJson.writePackageJsonFile(rootPjFile, rootPj);

        const makeModule = async (name: string) => {
          const module1Dir = path.join(dir, 'modules', name);
          fs.mkdirSync(module1Dir, { recursive: true });

          const pj = await PackageJson.decode({
            name,
            version: '2.71.1'
          });
          const pjFile = path.join(module1Dir, 'package.json');
          await PackageJson.writePackageJsonFile(pjFile, pj);
          return { pj, pjFile };
        };

        const m1 = await makeModule('module1');
        const m2 = await makeModule('module2');

        await git.add([ rootPjFile, m1.pjFile, m2.pjFile ]);
        await git.commit('initial');
        await Git.push(git);

        const actual = await getBranchDetails(dir);
        assert.deepEqual(actual, {
          currentBranch: 'main',
          branchState: BranchState.ReleaseReady,
          branchType: BranchType.Main,
          version: await Version.parseVersion('1.2.3'),
          workspacesEnabled: true,
          rootModule: {
            packageJson: rootPj,
            packageJsonFile: rootPjFile
          },
          modules: {
            module1: {
              packageJson: m1.pj,
              packageJsonFile: m1.pjFile
            },
            module2: {
              packageJson: m2.pj,
              packageJsonFile: m2.pjFile
            }
          }
        });
      });
    });
  });
});
