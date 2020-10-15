import * as E from 'fp-ts/Either';

type Either<R, A> = E.Either<R, A>;

export const getOrThrow = <R, A>(either: Either<R, A>, onError: (r: R) => Error = (r: R) => {
  throw new Error(String(r));
}): A =>
  E.fold((e: R) => {
    throw onError(e);
  }, (a: A) => a)(either);
