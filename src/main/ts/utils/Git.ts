import * as gitP from 'simple-git/promise';
import { PushResult } from 'simple-git';
import * as O from 'fp-ts/Option';
import { BeehiveArgs } from '../args/BeehiveArgs';
import { mainBranchName } from '../core/BranchLogic';
import * as Files from './Files';
import * as ObjUtils from './ObjUtils';
import * as PromiseUtils from './PromiseUtils';

type SimpleGit = gitP.SimpleGit;
type Option<A> = O.Option<A>;

const ASSUMED_REMOTE = 'origin'; // This module assumes a single remote called 'origin'

export const isClean = (git: SimpleGit): Promise<boolean> =>
  git.status().then((s) => s.isClean());

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
  const dir = temp._tag === 'Some' ? temp.value : (await Files.tempFolder());
  return await cloneIn(gitUrl, dir);
};

export const checkoutNewBranch = (git: SimpleGit, branchName: string): Promise<string> =>
  git.checkout([ '-b', branchName ]);

export const currentBranch = (git: SimpleGit): Promise<string> =>
  git.branch().then((b) => b.current);

export const pushNewBranch = async (git: SimpleGit): Promise<PushResult> => {
  const cur = await currentBranch(git);
  return git.push(ASSUMED_REMOTE, cur, { '--set-upstream': null });
};

export const currentRevisionSha = (git: SimpleGit): Promise<string> =>
  git.revparse({ HEAD: null });

export const currentRevisionShortSha = (git: SimpleGit): Promise<string> =>
  git.revparse({ 'HEAD': null, '--short': null });

export const push = async (git: SimpleGit): Promise<PushResult> =>
  git.push(ASSUMED_REMOTE);

export const doesRemoteBranchExist = async (git: SimpleGit, branchName: string): Promise<boolean> => {
  const b = await git.branch();
  return ObjUtils.hasKey(b.branches, 'remotes/origin/' + branchName);
};

const dryRunMessage = async (dir: string, git: SimpleGit): Promise<string> => {
  const curBranch = await currentBranch(git);
  return `dry-run - not pushing. To complete, push "${curBranch}" branch from ${dir}`;
};

export const pushNewBranchUnlessDryRun = async (fc: BeehiveArgs, dir: string, git: SimpleGit): Promise<void> => {
  if (fc.dryRun) {
    console.log(await dryRunMessage(dir, git));
  } else {
    console.log('git push');
    await pushNewBranch(git);
  }
};
export const pushUnlessDryRun = async (args: BeehiveArgs, dir: string, git: SimpleGit): Promise<void> => {
  if (args.dryRun) {
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

export const checkoutMainBranch = (git: SimpleGit): Promise<string> =>
  checkout(git, mainBranchName);

export const checkout = async (git: SimpleGit, branchName: string): Promise<string> => {
  console.log(`Checking out branch: ${branchName}`);
  await git.checkout(branchName);
  return branchName;
};

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

export const detectGitUrlCwd = async (): Promise<string> => {
  const s = process.cwd();
  return await detectGitUrlFromDir(s);
};

export const resolveGitUrl = async (gitUrlArg: Option<string>): Promise<string> =>
  gitUrlArg._tag === 'Some' ? gitUrlArg.value : await detectGitUrlCwd();