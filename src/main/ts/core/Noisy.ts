import { optionToPromise } from '../utils/PromiseUtils';
import * as PackageJson from './PackageJson';
import * as Version from './Version';

// This module contains high-level operations used by the commands. Unlike those in utils, these are allowed to log console messages.

// TODO: This module's existence is dubious...

type Version = Version.Version;
type PackageJson = PackageJson.PackageJson;

export const readPackageJsonFileInDirAndRequireVersion = async (dir: string): Promise<{ pjFile: string; pj: PackageJson; version: Version }> => {
  console.log(`Parsing package.json file in dir: ${dir}`);
  const pjFile = PackageJson.pjInFolder(dir);
  const pj = await PackageJson.parsePackageJsonFile(pjFile);

  const version = await optionToPromise(pj.version, 'Version missing in package.json file');
  console.log(`package.json has version: ${Version.versionToString(version)}`);
  return { pjFile, pj, version };
};


