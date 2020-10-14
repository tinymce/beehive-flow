import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const hasKey = <T> (o: T, k: keyof T): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

export const lookup = <T> (o: T, k: keyof T): Option<T[keyof T]> =>
  hasKey(o, k) ? O.some(o[k]) : O.none;
