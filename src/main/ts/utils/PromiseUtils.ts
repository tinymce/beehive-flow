import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

type Either<R, A> = E.Either<R, A>;

export const eitherToPromise = <R, A>(e: Either<R, A>): Promise<A> =>
  new Promise((resolve, reject) => {
    E.fold(reject, resolve)(e);
  });

export const eitherToPromiseVoid = <R, A>(e: Either<R, A>): Promise<void> =>
  voidify(eitherToPromise(e));

export const voidify = <A>(p: Promise<A>): Promise<void> =>
  p.then(() => {});

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

/**
 * Catch the success or error cases of a Promise as an Either. Always succeeds (but could still be non-terminating).
 * @param promise
 */
export const tryPromise = <A> (promise: Promise<A>): Promise<Either<unknown, A>> =>
  promise.then(
    (a) => succeed(E.right(a)),
    (e) => succeed(E.left(e))
  );
