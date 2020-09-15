import * as pkg from 'read-pkg';

export type PackageJson = pkg.PackageJson;

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  pkg({ cwd: folder });
