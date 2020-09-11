import * as Git from './Git';
import simpleGit, { SimpleGit } from 'simple-git/promise'
import * as TempFiles from './TempFiles';
import * as Hardcoded from './Hardcoded';


// TODO: Pass in git repo / git url? Use current checkout?

export const freeze = async () => {

  const gitUrl = Hardcoded.tinymceGitUrl;

  const { dir, git } = await Git.cloneInTempFolder(gitUrl);

  await git.checkout('master');

  // TODO: read the 2-point version from package.json
  // TODO: branch
  // TODO: write primaryBranch file

  // git.add
  // await git.commit('');
  await git.push();

  console.log("freeze invoked");
};
