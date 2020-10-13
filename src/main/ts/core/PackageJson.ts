import * as Version from './Version';
import * as JsonUtils from './JsonUtils';
import * as Type from './Type';

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
  JsonUtils.optionalFieldSuchThat(pj, 'version', (j) =>
    Type.isString(pj.version)
      ? Version.parseVersion(pj.version)
      : E.left('version field was not a string')
  );


const pjInFolder = (folder: string) => path.join(folder, 'package.json');

export const parsePackageJsonFileInFolder = async (folder: string): Promise<PackageJson> => {
  const pj = await JsonUtils.parseJsonRecordFile(pjInFolder(folder));
  const parsedVersion = await parsePackageJsonVersion(pj);

  const { version, ...other } = pj;

  return {
    version: parsedVersion,
    other
  };
};

export const toJson = (pj: PackageJson): JsonRecord => ({
  ...pj.other,
  ...JsonUtils.optionalToJsonRecord('version', pj.version, Version.versionToString)
});

export const writePackageJsonFileInFolder = async (folder: string, pj: PackageJson): Promise<void> =>
  JsonUtils.writeJsonFile(pjInFolder(folder), toJson(pj));
