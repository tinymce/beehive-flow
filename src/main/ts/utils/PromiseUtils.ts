import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as EitherUtils from './EitherUtils';
import * as Type from './Type';

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
    reject(errorify(error));
  }));

const errorify = (error?: unknown): unknown =>
  Type.isString(error) ? new Error(error) : error;

export const tryPromise = <A> (p: Promise<A>): Promise<Either<unknown, A>> =>
  p.then(E.right, E.left);

export const getOrElse = <A> (p: Promise<A>, other: A): Promise<A> =>
  p.then((x) => x, () => other);

export const setError = <A> (p: Promise<A>, error: unknown): Promise<A> =>
  p.catch(() => fail(error));

export const parMap = <A, B> (input: readonly A[], p: (a: A) => Promise<B>): Promise<B[]> =>
  Promise.all(input.map(p));

export const filterMap = async <A, B> (input: A[], p: (a: A) => Promise<B>): Promise<B[]> =>
  parMap(input, (a) => tryPromise(p(a))).then(EitherUtils.rights);

export const poll = async <B> (fn: () => Promise<B>, timeout: number, delay: number): Promise<B> => new Promise((resolve, reject) => {
  const start = Date.now();
  const check = () => {
    fn().then(resolve, () => {
      const now = Date.now();
      if (now - start > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, delay);
      }
    });
  };
  check();
});