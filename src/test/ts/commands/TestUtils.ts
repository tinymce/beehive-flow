import * as path from 'path';
import { SimpleGit } from 'simple-git/promise';
import * as Git from '../../../main/ts/utils/Git';
import * as Files from '../../../main/ts/utils/Files';
import * as Parser from '../../../main/ts/args/Parser';
import * as Dispatch from '../../../main/ts/args/Dispatch';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import { versionToString } from '../../../main/ts/core/Version';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import * as ObjUtils from '../../../main/ts/utils/ObjUtils';

export const makeBranchWithPj = async (git: SimpleGit, branchName: string, address: string, dir: string, packageName: string, version: string) => {
  await Git.checkoutNewBranch(git, branchName);
  const npmrcFile = await writeNpmrc(address, dir);
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
  await git.add([ npmrcFile, pjFile ]);
  await git.commit('commit');
  await Git.push(git);
  return pjFile;
};

export const writeAndCommitFile = async (git: SimpleGit, dir: string, branchName: string, fileName: string, contents: string = 'placeholder') => {
  await git.checkout([ branchName ]);
  const file = path.join(dir, fileName);
  await Files.writeFile(file, contents);
  await git.add([ file ]);
  await git.commit('commit msg');
};

export const writeNpmrc = async (address: string, dir: string): Promise<string> => {
  const npmrc = `@beehive-test:registry=${address}`;
  const npmrcFile = path.join(dir, '.npmrc');
  await Files.writeFile(npmrcFile, npmrc);
  return npmrcFile;
};

export const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  if (a._tag === 'Some') {
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
