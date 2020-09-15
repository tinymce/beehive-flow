import * as fs from 'fs';
import * as util from 'util';
import * as tmp from 'tmp';

export const fileMustExist = (filename: string): Promise<string> => new Promise<string>((resolve, reject) => {
  if (!fs.existsSync(filename)) {
    reject(new Error('file not found: ' + filename));
  } else {
    resolve(filename);
  }
});

export const readFile: (filename: string) => Promise<Buffer> =
  util.promisify(fs.readFile);

export const readFileAsString = (filename: string): Promise<string> =>
  readFile(filename).then((c) => c.toString());

export const writeFile: (filename: string, contents: string) => Promise<unknown> =
  util.promisify(fs.writeFile);

export const exists: (filename: string) => Promise<boolean> =
  util.promisify(fs.exists);

export const tempFolder: () => Promise<string> =
  util.promisify(tmp.dir);
