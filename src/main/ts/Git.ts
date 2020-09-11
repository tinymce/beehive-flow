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
  git: SimpleGit;
  dir: string;
}

// TODO: are we removing these folders on exit?

export const initInTempFolder = async (bare: boolean = false): Promise<TempGit> => {
  const { dir, git } = await tempGitP();
  await git.init(bare);
  return { dir, git };
};

export const cloneInTempFolder = async (repoPath: string): Promise<TempGit> => {
  const { dir, git } = await tempGitP();
  await git.clone(repoPath, dir);
  return { dir, git };
}

const tempGitP = async (): Promise<TempGit> => {
  const dir = await tempFolder();
  const git = gitP(dir);
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
