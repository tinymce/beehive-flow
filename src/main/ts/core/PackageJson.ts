import * as path from 'path';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/pipeable';
import * as JsonUtils from '../utils/JsonUtils';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Version from './Version';

type Either<R, A> = E.Either<R, A>;
type Option<A> = O.Option<A>;
type Version = Version.Version;

export interface PackageJson {
  readonly name: string;
  readonly version?: Version;
  readonly workspaces?: string[];
  [k: string]: unknown;
}

export const validateEither = <I, O> (f: (i: I) => Either<string, O>): t.Validate<I, O> =>
  (value, context) =>
    pipe(
      f(value),
      E.mapLeft((message: string) => [{ value, context, message }])
    );

export const versionCodec = new t.Type<Version, string, string>(
  'versionCodec',
  (input: unknown): input is Version => false,
  validateEither(Version.parseVersionE),
  Version.versionToString
);

export const packageJsonCodec = (): t.Type<PackageJson, unknown> => {
  const mandatory = t.type({
    name: t.string
  });

  const partial = t.partial({
    version: t.string.pipe(versionCodec),
    workspaces: t.array(t.string)
  });

  return t.intersection([ mandatory, partial ]);
};

export const pjInFolder = (folder: string): string =>
  path.join(folder, 'package.json');

export const parseE = (j: unknown): t.Validation<PackageJson> =>
  packageJsonCodec().decode(j);

export const parse = async (j: unknown): Promise<PackageJson> =>
  PromiseUtils.eitherToPromise(parseE(j));

export const parsePackageJsonFile = (file: string): Promise<PackageJson> =>
  JsonUtils.parseJsonFile(file).then(parse);

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

