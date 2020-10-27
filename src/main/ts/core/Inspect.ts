import * as gitP from 'simple-git/promise';
import { Option } from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';

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


