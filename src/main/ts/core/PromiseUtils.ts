import * as E from 'fp-ts/Either';

type Either<R, A> = E.Either<R, A>;

export const eitherToPromise = <R, A> (e: Either<R, A>): Promise<A> => new Promise((resolve, reject) => {
  E.fold(reject, resolve)(e);
});
