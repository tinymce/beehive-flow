import * as path from 'path';
import * as O from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import * as Dispatch from '../../../main/ts/args/Dispatch';
import * as Parser from '../../../main/ts/args/Parser';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import { versionToString } from '../../../main/ts/core/Version';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as ObjUtils from '../../../main/ts/utils/ObjUtils';

const writePackageJson = async (dir: string, packageName: string, version: string, address: string = 'blah://frog') => {
  const pjFile = path.join(dir, 'package.json');
  const pjContents = `
      {
        "name": "@beehive-test/${packageName}",
        "version": "${version}",
        "publishConfig": {
          "@beehive-test:registry": "${address}"
        }
      }`;
  await Files.writeFile(pjFile, pjContents);
  return pjFile;
};

export const writeAndAddLocalFile = async (git: SimpleGit, dir: string, fileName: string, contents: string = 'placeholder') => {
  const filePath = path.join(dir, fileName);
  await Files.writeFile(filePath, contents);
  await git.add([ filePath ]);
  return filePath;
};

export const writeNpmrc = async (address: string, dir: string): Promise<string> => {
  const npmrc = `@beehive-test:registry=${address}`;
  const npmrcFile = path.join(dir, '.npmrc');
  await Files.writeFile(npmrcFile, npmrc);
  return npmrcFile;
};

export const makeBranchWithPj = async (
  git: SimpleGit,
  branchName: string,
  dir: string,
  packageName: string,
  version: string,
  address: string = 'blah://frog'
) => {
  await Git.checkoutNewBranch(git, branchName);
  const npmrcFile = await writeNpmrc(address, dir);
  const pjFile = await writePackageJson(dir, packageName, version, address);
  await git.add([ npmrcFile, pjFile ]);
  await git.commit('commit');
  await Git.push(git);
  return pjFile;
};

export const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  if (O.isSome(a)) {
    await Dispatch.dispatch(a.value);
  } else {
    throw new Error('Args parse failure');
  }
};

export const getNpmTags = async (cwd: string, packageName: string): Promise<Record<string, string>> => {
  const tags = await NpmTags.getNpmTags(cwd, `@beehive-test/${packageName}`);
  return ObjUtils.map(tags, versionToString);
};

export const readPjVersion = async (pjFile: string): Promise<string> => {
  const pj = await PackageJson.parsePackageJsonFile(pjFile);
  const v = pj.version;
  if (v === undefined) {
    throw new Error('Version was undefined');
  }
  return versionToString(v);
};

export const readPjVersionInDir = async (dir: string): Promise<string> =>
  readPjVersion(path.join(dir, 'package.json'));

export const makeReleaseTags = async (git: SimpleGit, dir: string, packageName: string, tags: string[]): Promise<void> => {
  await Git.checkoutMainBranch(git);
  const tempBranchName = 'temp';
  await Git.checkoutNewBranch(git, tempBranchName);
  for (const tag of tags) {
    const pjFile = await writePackageJson(dir, packageName, tag);
    await git.add([ pjFile ]);
    await git.commit(`Release ${tag}`);
    await git.addTag(tag);
  }
  await Git.checkoutMainBranch(git);
  await git.deleteLocalBranch(tempBranchName, true);
  await git.push([ '--tags' ]);
};
