import * as O from 'fp-ts/Option';
import { PushResult } from 'simple-git';
import * as gitP from 'simple-git/promise';
import { mainBranchName } from '../core/BranchLogic';
import * as Files from './Files';
import * as ObjUtils from './ObjUtils';
import * as PromiseUtils from './PromiseUtils';
import * as StringUtils from './StringUtils';

type SimpleGit = gitP.SimpleGit;
type Option<A> = O.Option<A>;

const ASSUMED_REMOTE = 'origin'; // This module assumes a single remote called 'origin'

export interface TempGit {
  readonly git: SimpleGit;
  readonly dir: string;
}

export const initInTempFolder = async (bare: boolean = false): Promise<TempGit> => {
  const dir = await Files.tempFolder();
  const git = gitP(dir);
  await git.init(bare);
  return { dir, git };
};

export const cloneIn = async (gitUrl: string, dir: string): Promise<TempGit> => {
  console.log(`Cloning ${gitUrl} to ${dir}`);
  const git = gitP(dir);
  await git.clone(gitUrl, dir);
  return { dir, git };
};

export const cloneInTempFolder = async (gitUrl: string, temp: Option<string> = O.none): Promise<TempGit> => {
  const dir = O.isSome(temp) ? temp.value : (await Files.tempFolder());
  return await cloneIn(gitUrl, dir);
};

export const checkoutNewBranch = (git: SimpleGit, branchName: string): Promise<string> =>
  git.checkout([ '-b', branchName ]);

export const currentBranch = (git: SimpleGit): Promise<string> =>
  git.branch().then((b) => b.current);

export const push = async (git: SimpleGit): Promise<PushResult> => {
  const cur = await currentBranch(git);
  return git.push(ASSUMED_REMOTE, cur, { '--set-upstream': null });
};

export const pushOneTag = async (git: SimpleGit, tagName: string): Promise<PushResult> =>
  git.push(ASSUMED_REMOTE, tagName);

export const currentRevisionShortSha = (git: SimpleGit): Promise<string> =>
  git.revparse([ '--short', 'HEAD' ]);

export const remoteBranchNames = async (git: SimpleGit): Promise<string[]> => {
  const rbs = await git.branch();
  return rbs.all
    .filter((r) => r.startsWith('remotes/origin/'))
    .map((r) => StringUtils.removeLeading(r, 'remotes/origin/'));
};

export const doesRemoteBranchExist = async (git: SimpleGit, branchName: string): Promise<boolean> => {
  const b = await git.branch();
  return ObjUtils.hasKey(b.branches, 'remotes/origin/' + branchName);
};

const dryRunMessage = async (dir: string, git: SimpleGit): Promise<string> => {
  const curBranch = await currentBranch(git);
  return `dry-run - not pushing. To complete, push "${curBranch}" branch from ${dir}`;
};

export const pushUnlessDryRun = async (dir: string, git: SimpleGit, dryRun: boolean): Promise<void> => {
  if (dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await push(git);
  }
};

export const branchShouldNotExist = async (git: SimpleGit, branchName: string): Promise<void> => {
  if (await doesRemoteBranchExist(git, branchName)) {
    return PromiseUtils.fail(`Remote branch already exists: ${branchName}`);
  }
};

export const checkout = async (git: SimpleGit, branchName: string): Promise<string> => {
  console.log(`Checking out branch: ${branchName}`);
  await git.checkout(branchName);
  return branchName;
};

export const checkoutMainBranch = (git: SimpleGit): Promise<string> =>
  checkout(git, mainBranchName);

export const detectGitUrl = async (g: SimpleGit): Promise<string> => {
  const remotes = await g.getRemotes(true);
  if (remotes.length === 1) {
    return remotes[0].refs.fetch;
  } else if (remotes.length === 0) {
    return PromiseUtils.fail('Could not detect git url - the repo has no remotes.');
  } else {
    const res = remotes.find((r) => r.name === 'origin');
    if (res !== undefined) {
      return res.refs.fetch;
    } else {
      return PromiseUtils.fail('Could not detect git url - there were multiple remotes and none were called "origin"');
    }
  }
};

const detectGitUrlFromDir = async (dir: string): Promise<string> => {
  const g = gitP(dir);
  return await detectGitUrl(g);
};

export const resolveGitUrl = async (gitUrlArg: Option<string>, workingDirArg: string): Promise<string> =>
  O.isSome(gitUrlArg) ? gitUrlArg.value : await detectGitUrlFromDir(workingDirArg);

const isWorkingDirDirty = async (git: SimpleGit) => {
  const diff = await git.diffSummary([ 'HEAD' ]);
  return diff.changed > 0;
};

const isAheadOfRemote = async (git: SimpleGit, branchName: string) => {
  await git.fetch();
  const log = await git.log({ from: `origin/${branchName}`, to: branchName, symmetric: false });
  return log.total > 0;
};

export const hasLocalChanges = async (workingDir: string, branchName: string) => {
  const git = gitP(workingDir);
  const isAhead = await isAheadOfRemote(git, branchName);
  const isDirty = await isWorkingDirDirty(git);
  return isDirty || isAhead;
};

export const getTags = async (g: SimpleGit): Promise<string[]> => {
  const tags = await g.tags();
  return tags.all;
};
