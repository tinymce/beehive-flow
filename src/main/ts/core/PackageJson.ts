import * as path from 'path';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as JsonUtils from '../utils/JsonUtils';
import * as Version from './Version';

type Option<A> = O.Option<A>;
type Version = Version.Version;
type JsonRecord = E.JsonRecord;

export interface PackageJson {
  readonly version: Option<Version>;
  readonly other: Omit<JsonRecord, 'version'>;
}

const parsePackageJsonVersion = (pj: JsonRecord): Promise<Option<Version>> =>
  JsonUtils.optionalStringFieldSuchThat(pj, 'version', Version.parseVersion);

export const pjInFolder = (folder: string): string =>
  path.join(folder, 'package.json');

const fromJson = async (j: JsonRecord): Promise<PackageJson> => {
  const parsedVersion = await parsePackageJsonVersion(j);

  const { version, ...other } = j;

  return {
    version: parsedVersion,
    other
  };
};

export const parsePackageJsonFile = (file: string): Promise<PackageJson> =>
  JsonUtils.parseJsonRecordFile(file).then(fromJson);

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  parsePackageJsonFile(pjInFolder(folder));

export const toJson = (pj: PackageJson): JsonRecord => ({
  ...pj.other,
  ...JsonUtils.optionalToJsonRecord('version', pj.version, Version.versionToString)
});

export const writePackageJsonFile = (file: string, pj: PackageJson): Promise<void> =>
  JsonUtils.writeJsonFile(file, toJson(pj));

export const writePackageJsonFileInFolder = (folder: string, pj: PackageJson): Promise<void> =>
  writePackageJsonFile(pjInFolder(folder), pj);

export const setVersion = (pj: PackageJson, version: Option<Version>): PackageJson => ({
  ...pj,
  version
});
