import * as gitP from "simple-git/promise";
import { tempFolder } from "./TempFiles";
import { PushResult } from "simple-git";

type SimpleGit = gitP.SimpleGit;

const ASSUMED_REMOTE = 'origin'; // This module assumes a single remote called 'origin'

export const isClean = async (git: SimpleGit): Promise<boolean> => {
  const status = await git.status();
  return status.isClean();
};

export interface TempGit {
  readonly git: SimpleGit;
  readonly dir: string;
}

// TODO: are we removing these folders on exit?

export const initInTempFolder = (bare: boolean = false): Promise<TempGit> =>
  withTempGit((dir, git) => git.init(bare));

export const cloneInTempFolder = async (repoPath: string): Promise<TempGit> =>
  withTempGit((dir, git) => git.clone(repoPath, dir));

const withTempGit = async <T> (f: (dir: string, git: SimpleGit) => Promise<T>): Promise<TempGit> => {
  const dir = await tempFolder();
  const git = gitP(dir);
  f(dir, git);
  return { dir, git };
}

export const checkoutNewBranch = (git: SimpleGit, branchName: string): Promise<string> =>
  git.checkout([ '-b', branchName ]);

export const currentBranch = async (git: SimpleGit): Promise<string> => {
  const b = await git.branch();
  return b.current;
}

export const pushNewBranch = async (git: SimpleGit): Promise<PushResult> => {
  const cur = await currentBranch(git);
  return git.push(ASSUMED_REMOTE, cur, { '--set-upstream': null });
}

export const doesRemoteBranchExist = async (git: SimpleGit, branchName: string): Promise<boolean> => {
  const b = await git.branch();
  return b.branches.hasOwnProperty('remotes/origin/' + branchName);
};
