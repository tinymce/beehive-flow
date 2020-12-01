import * as fs from 'fs';
import * as util from 'util';
import * as tmp from 'tmp';

tmp.setGracefulCleanup();

export const readFile: (filename: string) => Promise<Buffer> =
  util.promisify(fs.readFile);

export const readFileAsString = (filename: string): Promise<string> =>
  readFile(filename).then((c) => c.toString());

export const writeFile: (filename: string, contents: string) => Promise<void> =
  util.promisify(fs.writeFile);

export const exists: (filename: string) => Promise<boolean> =
  util.promisify(fs.exists);

export const tempFolder = (options: tmp.DirOptions = { keep: false, prefix: 'beehive-flow', unsafeCleanup: true }): Promise<string> => {
  const tf: (o?: tmp.DirOptions) => Promise<string> = util.promisify(tmp.dir);
  return tf(options);
};
