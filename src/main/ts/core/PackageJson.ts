import * as Version from './Version';
import * as JsonUtils from './JsonUtils';

import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as path from 'path';

type Option<A> = O.Option<A>;
type Version = Version.Version;
type JsonRecord = E.JsonRecord;

interface PackageJson {
  readonly version: Option<Version>;
  readonly other: Omit<JsonRecord, 'version'>
}

const parsePackageJsonVersion = (pj: JsonRecord): Promise<Option<Version>> =>
  JsonUtils.optionalStringFieldSuchThat(pj, 'version', Version.parseVersion);

const pjInFolder = (folder: string) => path.join(folder, 'package.json');

const fromJson = async (j: JsonRecord): Promise<PackageJson> => {
  const parsedVersion = await parsePackageJsonVersion(j);

  const {version, ...other} = j;

  return {
    version: parsedVersion,
    other
  };
};

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  JsonUtils.parseJsonRecordFile(pjInFolder(folder)).then(fromJson);

export const toJson = (pj: PackageJson): JsonRecord => ({
  ...pj.other,
  ...JsonUtils.optionalToJsonRecord('version', pj.version, Version.versionToString)
});

export const writePackageJsonFileInFolder = (folder: string, pj: PackageJson): Promise<void> =>
  JsonUtils.writeJsonFile(pjInFolder(folder), toJson(pj));
