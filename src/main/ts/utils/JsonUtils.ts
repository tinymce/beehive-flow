import * as PromiseUtils from './PromiseUtils';
import * as Files from './Files';
import kind_of = require('kind-of');

import * as E from 'fp-ts/Either';
import { Either } from 'fp-ts/Either';
import * as ObjUtils from './ObjUtils';
import * as Type from './Type';
import * as O from 'fp-ts/Option';

type Json = E.Json;
type JsonRecord = E.JsonRecord;
type Option<A> = O.Option<A>;

export const parse = (s: string): Promise<Json> => {
  const result = E.parseJSON(s, String);
  return PromiseUtils.eitherToPromise(result);
};

export const parseJsonRecord = (s: string): Promise<E.JsonRecord> => {
  const e = E.filterOrElse(isJsonRecord, () => 'JSON value was not an object')(E.parseJSON(s, String));
  return PromiseUtils.eitherToPromise(e);
};

export const isJsonRecord = (j: Json): j is JsonRecord =>
  kind_of(j) === 'object';

export const parseJsonFile = async (path: string): Promise<Json> => {
  const s = await Files.readFileAsString(path);
  return parse(s);
};

export const parseJsonRecordFile = async (path: string): Promise<JsonRecord> => {
  const s = await Files.readFileAsString(path);
  return parseJsonRecord(s);
};

export const writeJsonFile = async (path: string, j: Json): Promise<void> =>
  Files.writeFile(path, JSON.stringify(j));

export const optionalField = async (o: JsonRecord, k: string): Promise<Option<Json>> =>
  PromiseUtils.succeed(ObjUtils.lookup(o, k));

export const optionalStringField = async (o: JsonRecord, k: string): Promise<Option<string>> =>
  optionalFieldSuchThat(o, k, (j) => Type.isString(j) ? E.right(j) : E.left(`Expected key: ${k} to be a string`));

export const optionalFieldSuchThat = async <A>(o: JsonRecord, k: string, f: (v: Json) => Either<string, A>): Promise<Option<A>> => {
  const oa = await optionalField(o, k);

  return O.fold(
    () => PromiseUtils.succeed(O.none),
    (j: Json) => PromiseUtils.eitherToPromise(E.map<A, Option<A>>(O.some)(f(j)))
  )(oa);
};

export const optionalStringFieldSuchThat = async <A>(o: JsonRecord, k: string, f: (v: string) => Either<string, A>): Promise<Option<A>> =>
  optionalFieldSuchThat(o, k, (j) =>
    Type.isString(j) ? f(j) : E.left(`field ${k} was not a string`)
  );

export const optionalToJsonRecord = <A> (k: string, oa: Option<A>, f: (a: A) => Json): JsonRecord =>
  O.fold<A, JsonRecord>(
    () => ({}),
    (a) => ({ [k]: f(a) })
  )(oa);
