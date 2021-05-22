import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const eachAsync = async <A> (o: Option<A>, f: (a: A) => Promise<void>): Promise<void> => {
  if (O.isSome(o)) {
    return f(o.value);
  }
};

export const mapAsync = async <A, B> (o: Option<A>, f: (a: A) => Promise<B>): Promise<Option<B>> =>
  O.isSome(o) ? O.some(await f(o.value)) : O.none;

export const somes = <A> (options: Array<Option<A>>): Array<A> => {
  const r: A[] = [];
  for (const o of options) {
    if (O.isSome(o)) {
      r.push(o.value);
    }
  }
  return r;
};
