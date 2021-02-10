import * as path from 'path';
import * as O from 'fp-ts/Option';
import * as t from 'io-ts';
import * as JsonUtils from '../utils/JsonUtils';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Version from './Version';
import * as IotsUtils from '../utils/IotsUtils';

type Option<A> = O.Option<A>;
type Version = Version.Version;

export interface PackageJson {
  readonly name: string;
  readonly version?: Version;
  readonly workspaces?: string[];
  readonly 'beehive-flow'?: {
    'primary-workspace'?: string;
  };
  [k: string]: unknown;
}

export const versionCodec = new t.Type<Version, string, string>(
  'versionCodec',
  // We don't need a type guard function, so just provide a dummy one that always fails
  (input: unknown): input is Version => false,
  IotsUtils.validateEither(Version.parseVersionE),
  Version.versionToString
);

export const packageJsonCodec = (): t.Type<PackageJson, unknown> => {
  const mandatory = t.type({
    name: t.string
  });

  const partial = t.partial({
    version: t.string.pipe(versionCodec),
    workspaces: t.array(t.string),
    'beehive-flow': t.partial({
      'primary-workspace': t.string
    })
  });

  return t.intersection([ mandatory, partial ]);
};

export const pjInFolder = (folder: string): string =>
  path.join(folder, 'package.json');

export const decodeE = (j: unknown): t.Validation<PackageJson> =>
  packageJsonCodec().decode(j);

export const decode = async (j: unknown): Promise<PackageJson> =>
  PromiseUtils.eitherToPromise(decodeE(j));

export const parsePackageJsonFile = (file: string): Promise<PackageJson> =>
  JsonUtils.parseJsonFile(file).then(decode);

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  parsePackageJsonFile(pjInFolder(folder));

export const toJson = (pj: PackageJson): unknown =>
  packageJsonCodec().encode(pj);

export const writePackageJsonFile = (file: string, pj: PackageJson): Promise<void> =>
  JsonUtils.writeJsonFile(file, toJson(pj));

export const setVersion = (pj: PackageJson, version: Option<Version>): PackageJson => ({
  ...pj,
  version: O.toUndefined(version)
});

export const writePackageJsonFileWithNewVersion = async (pj: PackageJson, newVersion: Version, pjFile: string): Promise<PackageJson> => {
  console.log(`Setting version in ${pjFile} to: ${Version.versionToString(newVersion)}`);
  const newPj = setVersion(pj, O.some(newVersion));
  await writePackageJsonFile(pjFile, newPj);
  return newPj;
};

