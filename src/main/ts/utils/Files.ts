import * as fs from 'fs';
import * as util from 'util';
import * as tmp from 'tmp';

type PathLike = fs.PathLike;

export const fileMustExist = (filename: string): Promise<void> => new Promise<void>((resolve, reject) => {
  if (!fs.existsSync(filename)) {
    reject(new Error('file not found: ' + filename));
  } else {
    resolve();
  }
});

export const readFile: (filename: string) => Promise<Buffer> =
  util.promisify(fs.readFile);

export const readFileAsString = (filename: string): Promise<string> =>
  readFile(filename).then((c) => c.toString());

export const writeFile: (filename: string, contents: string) => Promise<void> =
  util.promisify(fs.writeFile);

export const exists: (filename: string) => Promise<boolean> =
  util.promisify(fs.exists);

export const tempFolder: () => Promise<string> =
  util.promisify(tmp.dir);

export const mkdir: (path: PathLike) => Promise<void> =
  util.promisify(fs.mkdir);
