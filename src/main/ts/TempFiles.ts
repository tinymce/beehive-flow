import * as tmp from 'tmp';

export const tempFolder = async (dirOptions: tmp.DirOptions = {}): Promise<string> => new Promise((resolve, reject) => {
  tmp.dir(dirOptions, (err: Error | null, name: string) => {
     if (err !== null) {
       reject(err);
     } else {
       resolve(name);
     }
  });
});
