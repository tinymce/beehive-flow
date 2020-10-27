import * as gitP from 'simple-git/promise';
import { Option } from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import * as Version from '../core/Version';
import * as Git from '../utils/Git';
import * as BranchLogic from '../core/BranchLogic';
import * as Files from '../utils/Files';
import * as Noisy from './Noisy';

type MajorMinorVersion = Version.MajorMinorVersion;

// TODO: Does this belong here?
export const detectGitUrl = async (g: SimpleGit): Promise<string> => {
  const remotes = await g.getRemotes(true);
  if (remotes.length === 1) {
    return remotes[0].refs.fetch;
  } else if (remotes.length === 0) {
    throw new Error('Could not detect git url - the repo has no remotes.');
  } else {
    const res = remotes.find((r) => r.name === 'origin');
    if (res !== undefined) {
      return res.refs.fetch;
    } else {
      throw new Error('Could not detect git url - there were multiple remotes and none were called "origin"');
    }
  }
};

const detectGitUrlFromDir = async (dir: string): Promise<string> => {
  const g = gitP(dir);
  return await detectGitUrl(g);
};

export const detectGitUrlCwd = async (): Promise<string> => {
  const s = process.cwd();
  return await detectGitUrlFromDir(s);
};

export const resolveGitUrl = async (gitUrlArg: Option<string>): Promise<string> =>
  gitUrlArg._tag === 'Some' ? gitUrlArg.value : await detectGitUrlCwd();


export const resolveTempDir = async (dirFromSetting: Option<string>): Promise<string> => {
  if (dirFromSetting._tag === 'Some') {
    return dirFromSetting.value;
  } else {
    // TODO: rename to tempDir
    return Files.tempFolder();
  }
};

// TODO: use or lose
export const detectReleaseBranchReleaseVersion = async (): Promise<MajorMinorVersion> => {
  const dir = process.cwd();
  const g = gitP(dir);
  const currentBranch = await Git.currentBranch(g);

  const pj = await Noisy.readPackageJsonFileInDirAndRequireVersion(dir);

  const bv = await BranchLogic.versionFromReleaseBranch(currentBranch);

  BranchLogic.checkReleaseBranchReleaseVersionE(pj.version, bv, currentBranch, 'package.json');
  return bv;
};

// TODO: use or lose
export const detectReleaseBranchPreReleaseVersion = async (): Promise<MajorMinorVersion> => {
  const dir = process.cwd();
  const g = gitP(dir);
  const currentBranch = await Git.currentBranch(g);

  const pj = await Noisy.readPackageJsonFileInDirAndRequireVersion(dir);

  const bv = await BranchLogic.versionFromReleaseBranch(currentBranch);

  BranchLogic.checkReleaseBranchPreReleaseVersionE(pj.version, bv, currentBranch, 'package.json');
  return bv;
};


