import * as O from 'fp-ts/Option';

type Option<A> = O.Option<A>;

export const eachAsync = async <A> (o: Option<A>, f: (a: A) => Promise<void>): Promise<void> => {
  if (o._tag === 'Some') {
    return f(o.value);
  }
};

export const mapAsync = async <A, B> (o: Option<A>, f: (a: A) => Promise<B>): Promise<Option<B>> =>
  o._tag === 'Some' ? O.some(await f(o.value)) : O.none;
