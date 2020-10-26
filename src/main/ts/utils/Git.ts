import * as gitP from 'simple-git/promise';
import { PushResult } from 'simple-git';
import * as O from 'fp-ts/Option';
import * as Files from './Files';
import * as ObjUtils from './ObjUtils';

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

// TODO: are we removing these folders on exit?

export const cloneInTempFolder = async (repoPath: string, temp: Option<string>): Promise<TempGit> => {
  const dir = temp._tag === 'Some' ? temp.value : (await Files.tempFolder());
  const git = gitP(dir);
  await git.clone(repoPath, dir);
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
