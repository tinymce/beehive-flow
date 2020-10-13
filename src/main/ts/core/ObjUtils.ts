import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const hasOwnProperty = <T> (o: T, k: keyof T): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

export const lookup = <T> (o: T, k: keyof T): Option<T[keyof T]> =>
  hasOwnProperty(o, k) ? O.some(o[k]) : O.none;
