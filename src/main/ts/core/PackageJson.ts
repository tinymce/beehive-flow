import * as path from 'path';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as t from 'io-ts';
import * as JsonUtils from '../utils/JsonUtils';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as IotsUtils from '../utils/IotsUtils';
import * as PreRelease from './PreRelease';
import * as Version from './Version';

type Option<A> = O.Option<A>;
type Version = Version.Version;

export interface PackageJson {
  readonly name: string;
  readonly version?: Version;
  readonly workspaces?: string[];
  readonly beehiveFlow?: {
    readonly primaryWorkspace?: string;
  };
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly [k: string]: unknown;
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
    beehiveFlow: t.partial({
      primaryWorkspace: t.string
    }),
    dependencies: t.record(t.string, t.string),
    devDependencies: t.record(t.string, t.string)
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

const hasPreReleaseDependency = (version: string) =>
  version.includes('-' + PreRelease.releaseCandidate) ||
  version.includes('-' + PreRelease.featureBranch) ||
  version.includes('-' + PreRelease.hotfixBranch) ||
  version.includes('-' + PreRelease.spikeBranch);

const lookupDeps = (pj: PackageJson, name: 'dependencies' | 'devDependencies', filter: (name: string) => boolean) => pipe(
  O.fromNullable(pj[name]),
  O.getOrElse(() => ({})),
  R.filterWithIndex(filter)
);

export const shouldNotHavePreReleasePackages = async (pj: PackageJson): Promise<void> => {
  const getInvalidDeps = (dependencies: Record<string, string>) => pipe(
    dependencies,
    R.filter(hasPreReleaseDependency),
    R.keys
  );

  const invalidDeps = getInvalidDeps({
    ...lookupDeps(pj, 'dependencies', () => true),
    ...lookupDeps(pj, 'devDependencies', (key) => key === '@tinymce/beehive-flow')
  });

  if (invalidDeps.length > 0) {
    const names = invalidDeps.join(', ');
    return PromiseUtils.fail(`Pre-release versions were found for: ${names}`);
  }
};