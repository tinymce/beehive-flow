import * as Git from './Git';
import * as Hardcoded from './Hardcoded';
import * as PackageJson from "./PackageJson";
import * as Version from "./Version";
import * as Files from "./Files";
import * as path from "path";


// TODO: Pass in git repo / git url? Use current checkout?

const pbFileName = 'primaryBranch';

export const freeze = (): Promise<void> =>
  runFreeze(Hardcoded.tinymceGitUrl)

async function writePrimaryBranchFileInDir(dir: string, b: string) {
  await Files.writeFile(path.resolve(dir, pbFileName), `primaryBranch = '$b'`);
}

const logb = (message: string): void =>
  console.log(' - ' + message);

export const runFreeze = async (gitUrl: string): Promise<void> => {
  console.log("Creating release branch based on 'master' branch (in temp folder)");

  logb('Cloning ' + gitUrl)
  const { dir, git } = await Git.cloneInTempFolder(gitUrl);
  logb('Cloned to ' + dir)

  logb('Checking out master');
  await git.checkout('master');

  await PackageJson.parsePackageJsonFileInFolder(dir).then((a) => {
    console.log('ok', a);
  }, (e) => {
    console.log('err', e);
  });

  logb('Parsing package.json file');
  const pj = await PackageJson.parsePackageJsonFileInFolder(dir);
  logb('package.json has version: ' + pj.version);

  const releaseBranchName = Version.releaseBranchName(pj.version);

  await git.checkout(releaseBranchName);
  await writePrimaryBranchFileInDir(dir, releaseBranchName);
  await git.add(pbFileName);
  await git.commit(`Creating release branch: $releaseBranchName`);
  await git.push();
};
