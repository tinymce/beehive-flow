import * as tmp from 'tmp';
import { DirOptions } from "tmp";

export const tempFolder = async (dirOptions: DirOptions = {}): Promise<string> => new Promise((resolve, reject) => {
  tmp.dir(dirOptions, (err: Error | null, name: string, removeCallback: () => void) => {
     if (err !== null) {
       reject(err);
     } else {
       resolve(name);
     }
  });
});
