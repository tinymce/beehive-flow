import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as EitherUtils from './EitherUtils';

type Either<R, A> = E.Either<R, A>;

export const eitherToPromise = <R, A>(e: Either<R, A>): Promise<A> =>
  new Promise((resolve, reject) => {
    E.fold(reject, resolve)(e);
  });

export const optionToPromise = <A>(o: O.Option<A>, e?: unknown): Promise<A> =>
  new Promise((resolve, reject) => {
    O.fold(() => reject(e), resolve)(o);
  });

export const succeed = <A>(a: A): Promise<A> =>
  new Promise((resolve) => {
    resolve(a);
  });

export const fail = <A>(error?: unknown): Promise<A> =>
  new Promise(((resolve, reject) => {
    reject(error);
  }));

export const tryPromise = <A> (p: Promise<A>): Promise<Either<unknown, A>> =>
  p.then(E.right, E.left);

export const filterMap = async <A, B> (input: A[], p: (a: A) => Promise<B>): Promise<B[]> =>
  parMap(input, (a) => tryPromise(p(a))).then(EitherUtils.rights);

export const parMap = <A, B> (input: A[], p: (a: A) => Promise<B>): Promise<B[]> =>
  Promise.all(input.map(p));
