import * as t from 'io-ts';
import { pipe } from 'fp-ts/pipeable';
import * as E from 'fp-ts/Either';

type Either<R, A> = E.Either<R, A>;

/**
 * All this really does is change the shape of the error side of the Either
 * @param f
 */
export const validateEither = <I, O> (f: (i: I) => Either<string, O>): t.Validate<I, O> =>
  (value, context) =>
    pipe(
      f(value),
      E.mapLeft((message: string) => [{ value, context, message }])
    );
