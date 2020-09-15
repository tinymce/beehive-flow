import { parseVersion, Version } from "./Version";
import { JsonDecoder } from "ts.data.json";
import Decoder = JsonDecoder.Decoder;
import { decodeStringAsPromise, eitherToDecoder } from "./Json";
import * as Files from "./Files";
import * as path from "path";

export interface PackageJson {
  readonly version: Version;
}

// TODO: Is "version" mandatory? Should we parse it as an Option?
const packageJsonDecoder: Decoder<PackageJson> =
  JsonDecoder.object<PackageJson>(
    {
      version: JsonDecoder.string.then((s) => eitherToDecoder(parseVersion(s)))
    },
    'PackageJson'
  );

export const parsePackageJson = (s: string): Promise<PackageJson> =>
  decodeStringAsPromise(packageJsonDecoder, s);

export const parsePackageJsonFile = async (filename: string): Promise<PackageJson> =>
  Files.readFileAsString(filename).then(parsePackageJson);

export const parsePackageJsonFileInFolder = (folder: string): Promise<PackageJson> =>
  parsePackageJsonFile(path.resolve(folder, 'package.json'));
