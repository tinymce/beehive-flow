import * as fs from 'fs';
import * as util from 'util';

export const fileMustExist = (filename: string): Promise<string> => new Promise<string>((resolve, reject) => {
  if (!fs.existsSync(filename)) {
    reject(new Error('file not found: ' + filename));
  } else {
    resolve(filename);
  }
});

export const readFile = util.promisify(fs.readFile);

export const readFileAsString = (filename: string): Promise<string> =>
  readFile(filename).then((c) => c.toString());

export const writeFile = util.promisify(fs.writeFile);

export const exists = util.promisify(fs.exists);
