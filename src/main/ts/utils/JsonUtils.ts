import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as PromiseUtils from './PromiseUtils';
import * as Files from './Files';
import * as ObjUtils from './ObjUtils';
import * as Type from './Type';
import { mapAsync } from './OptionUtils';

type Json = E.Json;
type JsonRecord = E.JsonRecord;

export const parse = (s: string): Promise<Json> => {
  const result = E.parseJSON(s, String);
  return PromiseUtils.eitherToPromise(result);
};

export const isJsonRecord = (j: Json): j is JsonRecord =>
  Type.isObject(j);

export const parseJsonRecord = (s: string): Promise<E.JsonRecord> => {
  const e = E.filterOrElse(isJsonRecord, () => 'JSON value was not an object')(E.parseJSON(s, String));
  return PromiseUtils.eitherToPromise(e);
};

export const parseJsonFile = async (path: string): Promise<Json> => {
  const s = await Files.readFileAsString(path);
  return parse(s);
};

export const parseJsonRecordFile = async (path: string): Promise<JsonRecord> => {
  const s = await Files.readFileAsString(path);
  return parseJsonRecord(s);
};

export const prettyPrint = (j: Json): string =>
  JSON.stringify(j, null, 2);

export const writeJsonFile = async (path: string, j: Json): Promise<void> =>
  Files.writeFile(path, prettyPrint(j) + '\n');

export const field = async (o: JsonRecord, k: string): Promise<Json> =>
  PromiseUtils.optionToPromise(ObjUtils.lookup(o, k));

const mustBeString = (k: string) => async (j: Json): Promise<string> =>
  Type.isString(j) ? j : PromiseUtils.fail(`Expected value for key "${k}" to be a string`);

export const stringField = async (o: JsonRecord, k: string): Promise<string> => {
  const f = await field(o, k);
  return mustBeString(k)(f);
};

export const optionalField = async (o: JsonRecord, k: string): Promise<O.Option<Json>> =>
  PromiseUtils.succeed(ObjUtils.lookup(o, k));

export const optionalFieldSuchThat = async <A>(o: JsonRecord, k: string, f: (v: Json) => Promise<A>): Promise<O.Option<A>> => {
  const oa = await optionalField(o, k);
  return mapAsync(oa, f);
};

export const optionalStringField = async (o: JsonRecord, k: string): Promise<O.Option<string>> =>
  optionalFieldSuchThat(o, k, mustBeString(k));

export const optionalStringFieldSuchThat = async <A>(o: JsonRecord, k: string, f: (v: string) => Promise<A>): Promise<O.Option<A>> => {
  const os = await optionalStringField(o, k);
  return mapAsync(os, f);
};

export const optionalToJsonRecord = <A>(k: string, oa: O.Option<A>, f: (a: A) => Json): JsonRecord =>
  O.fold<A, JsonRecord>(
    () => ({}),
    (a) => ({ [k]: f(a) })
  )(oa);
