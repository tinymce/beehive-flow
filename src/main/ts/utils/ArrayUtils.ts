import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const sort = <T> (ts: T[], compareFn?: (a: T, b: T) => number): T[] =>
  [ ...ts ].sort(compareFn);

export const last = <T> (ts: T[]): Option<T> =>
  ts.length === 0 ? O.none : O.some(ts[ts.length - 1]);

export const greatest = <T> (ts: T[], compareFn?: (a: T, b: T) => number): Option<T> =>
  last(sort(ts, compareFn));
