import * as path from 'path';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as JsonUtils from '../utils/JsonUtils';
import * as Version from './Version';

type Option<A> = O.Option<A>;
type Version = Version.Version;
type JsonRecord = E.JsonRecord;

export interface PackageJson {
  readonly name: string;
  readonly version: Option<Version>;
  readonly workspaces: Option<string[]>;
  readonly other: Omit<JsonRecord, 'version'>;
}

const parsePackageJsonVersion = (pj: JsonRecord): Promise<Option<Version>> =>
  JsonUtils.optionalStringFieldSuchThat(pj, 'version', Version.parseVersion);

// TODO: make sure name is valid (inc no spaces)
const parsePackageJsonName = (pj: JsonRecord): Promise<string> =>
  JsonUtils.stringField(pj, 'name');

const parsePackageJsonWorkspaces = (pj: JsonRecord): Promise<Option<string[]>> =>
  JsonUtils.optionalArrayStringField(pj, 'workspaces');

export const pjInFolder = (folder: string): string =>
  path.join(folder, 'package.json');

const fromJson = async (j: JsonRecord): Promise<PackageJson> => {
  const parsedVersion = await parsePackageJsonVersion(j);
  const parsedName = await parsePackageJsonName(j);
  const parsedPackageWorkspaces = await parsePackageJsonWorkspaces(j);

  const { version, name, workspaces, ...other } = j;

  return {
    name: parsedName,
    version: parsedVersion,
    workspaces: parsedPackageWorkspaces,
    other
  };
};

export const parsePackageJsonFile = (file: string): Promise<PackageJson> =>
  JsonUtils.parseJsonRecordFile(file).then(fromJson);

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  parsePackageJsonFile(pjInFolder(folder));

export const toJson = (pj: PackageJson): JsonRecord => ({
  ...pj.other,
  ...JsonUtils.optionalToJsonRecord('version', pj.version, Version.versionToString),
  ...JsonUtils.optionalToJsonRecord('workspaces', pj.workspaces, (a) => a),
  name: pj.name
});

export const writePackageJsonFile = (file: string, pj: PackageJson): Promise<void> =>
  JsonUtils.writeJsonFile(file, toJson(pj));

export const setVersion = (pj: PackageJson, version: Option<Version>): PackageJson => ({
  ...pj,
  version
});

export const writePackageJsonFileWithNewVersion = async (pj: PackageJson, newVersion: Version, pjFile: string): Promise<PackageJson> => {
  console.log(`Setting version in ${pjFile} to: ${Version.versionToString(newVersion)}`);
  const newPj = setVersion(pj, O.some(newVersion));
  await writePackageJsonFile(pjFile, newPj);
  return newPj;
};

export const hasWorkspacesSetting = (pj: PackageJson): boolean =>
  O.isSome(pj.workspaces);
