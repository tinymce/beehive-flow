import * as E from 'fp-ts/Either';

export const getOrThrow = <R, A>(either: E.Either<R, A>, onError: (r: R) => Error = (r: R) => {
  throw new Error(String(r));
}): A =>
  E.fold((e: R) => {
    throw onError(e);
  }, (a: A) => a)(either);
