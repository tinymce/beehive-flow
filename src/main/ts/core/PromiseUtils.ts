import * as E from 'fp-ts/Either';

type Either<E, A> = E.Either<E, A>;

export const eitherToPromise = <E, A> (e: Either<E, A>): Promise<A> => new Promise((resolve, reject) => {
  E.fold(reject, resolve)(e);
});
