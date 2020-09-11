import * as fs from "fs";
import * as util from 'util';

export const fileMustExist = (filename: string): Promise<void> => new Promise<void>((resolve, reject) => {
  if (!fs.existsSync(filename)) {
    reject(new Error('file not found: ' + filename));
  }
});

export const readFile = util.promisify(fs.readFile);

export const readFileAsString = async (filename: string): Promise<string> => {
  const content = await readFile(filename);
  return content.toString();
}

export const writeFile = util.promisify(fs.writeFile);
