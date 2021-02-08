import * as E from 'fp-ts/Either';
import * as PromiseUtils from './PromiseUtils';
import * as Files from './Files';

type Json = E.Json;

export const parse = (s: string): Promise<Json> => {
  const result = E.parseJSON(s, String);
  return PromiseUtils.eitherToPromise(result);
};

export const parseJsonFile = async (path: string): Promise<Json> => {
  const s = await Files.readFileAsString(path);
  return parse(s);
};

export const prettyPrint = (j: unknown): string =>
  JSON.stringify(j, null, 2);

export const writeJsonFile = async (path: string, j: unknown): Promise<void> =>
  Files.writeFile(path, prettyPrint(j) + '\n');
