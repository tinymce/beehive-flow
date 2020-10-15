import * as gitP from 'simple-git/promise';
import { PushResult } from 'simple-git';
import * as Files from './Files';
import * as ObjUtils from './ObjUtils';

type SimpleGit = gitP.SimpleGit;

const ASSUMED_REMOTE = 'origin'; // This module assumes a single remote called 'origin'

export const isClean = (git: SimpleGit): Promise<boolean> =>
  git.status().then((s) => s.isClean());

export interface TempGit {
  readonly git: SimpleGit;
  readonly dir: string;
}

// TODO: are we removing these folders on exit?

export const initInTempFolder = (bare: boolean = false): Promise<TempGit> =>
  withTempGit((dir, git) => git.init(bare));

export const cloneInTempFolder = (repoPath: string): Promise<TempGit> =>
  withTempGit((dir, git) => git.clone(repoPath, dir));

const withTempGit = async <T>(f: (dir: string, git: SimpleGit) => Promise<T>): Promise<TempGit> => {
  const dir = await Files.tempFolder();
  const git = gitP(dir);
  await f(dir, git);
  return { dir, git };
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
