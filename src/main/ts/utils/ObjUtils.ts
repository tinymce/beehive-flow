import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const hasKey = <T>(o: T, k: keyof T): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

export const lookup = <T>(o: T, k: keyof T): Option<T[keyof T]> =>
  hasKey(o, k) ? O.some(o[k]) : O.none;

export const map = <A, B>(o: Record<string, A>, f: (a: A) => B): Record<string, B> => {
  const r: Record<string, B> = {};
  for (const k of Object.keys(o)) {
    r[k] = f(o[k]);
  }
  return r;
};

export const fromPairs = <A> (pairs: Array<[string, A]>): Record<string, A> => {
  const r: Record<string, A> = {};
  pairs.forEach(([ k, v ]) => {
    r[k] = v;
  });
  return r;
};
