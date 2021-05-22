import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as AdvanceVersion from '../core/AdvanceVersion';
import * as PackageJson from '../core/PackageJson';
import * as PromiseUtils from '../utils/PromiseUtils';
import { BranchState, getBranchDetails } from '../core/BranchLogic';
import { printHeaderMessage } from '../core/Messages';

type Version = Version.Version;
const { versionToString } = Version;

export const release = async (args: ReleaseArgs): Promise<void> => {
  printHeaderMessage(args);
  const gitUrl = await Git.resolveGitUrl(args.gitUrl, args.workingDir);

  const { dir, git } = await Git.cloneInTempFolder(gitUrl, args.temp);

  await Git.checkout(git, args.branchName);

  const branchDetails = await getBranchDetails(dir);
  if (branchDetails.branchState !== BranchState.ReleaseCandidate) {
    return PromiseUtils.fail('Branch is not in Release Candidate state - can\'t release.');
  }

  const newVersion = AdvanceVersion.updateToStable(branchDetails.version);
  console.log(`Updating version from ${versionToString(branchDetails.version)} to ${versionToString(newVersion)}`);

  const rootModule = branchDetails.rootModule;
  await PackageJson.writePackageJsonFileWithNewVersion(rootModule.packageJson, newVersion, rootModule.packageJsonFile);

  await git.add(rootModule.packageJsonFile);
  await git.commit('Branch is ready for release - setting release version');

  await Git.pushUnlessDryRun(dir, git, args.dryRun);
};
