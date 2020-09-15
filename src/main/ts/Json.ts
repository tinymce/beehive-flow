import * as O from 'fp-ts/lib/Option';
import { JsonDecoder, Result } from 'ts.data.json';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

type Either<E, A> = E.Either<E, A>;
type TaskEither<E, A> = TE.TaskEither<E, A>;
type Option<A> = O.Option<A>;
type Decoder<A> = JsonDecoder.Decoder<A>;

export const optionToDecoder = <T>(o: Option<T>, error: string = ""): Decoder<T> =>
  O.fold<T, Decoder<T>>(
    () => JsonDecoder.fail<T>(error),
    (s) => JsonDecoder.constant<T>(s)
  )(o);

export const eitherToDecoder = <T>(e: Either<string, T>): Decoder<T> =>
  E.fold<string, T, Decoder<T>>(
    (err) => JsonDecoder.fail<T>(err),
    (s) => JsonDecoder.constant<T>(s)
  )(e);

export const decodeStringAsOption = <T>(d: Decoder<T>, s: string): Option<T> =>
  O.fromEither(decodeStringAsEither(d, s));

export const decodeStringAsEither = <T>(d: Decoder<T>, s: string): Either<string, T> =>
  pipe(
    E.parseJSON(s, (e: any) => e.toString()),
    E.chain((j) => resultToEither(d.decode(j)))
  );

export const decodeStringAsPromise = <T> (d: Decoder<T>, s: string): Promise<T> => new Promise<T>((resolve, reject) => {
  E.fold<string, T, void>(reject, resolve)(decodeStringAsEither(d, s));
});

export const decodeStringAsTaskEither = <T>(d: Decoder<T>, s: string): TaskEither<string, T> =>
  TE.fromEither(decodeStringAsEither(d, s));

export const resultToOption = <T>(r: Result<T>): Option<T> =>
  r.isOk() ? O.some(r.value) : O.none;

export const resultToEither = <T>(r: Result<T>): Either<string, T> =>
  r.isOk() ? E.right(r.value) : E.left(r.error);

