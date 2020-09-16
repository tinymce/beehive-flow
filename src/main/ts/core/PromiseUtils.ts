import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

type Either<R, A> = E.Either<R, A>;
type Option<A> = O.Option<A>;

export const eitherToPromise = <R, A> (e: Either<R, A>): Promise<A> => new Promise((resolve, reject) => {
  E.fold(reject, resolve)(e);
});

export const optionToPromise = <A> (o: Option<A>, reason: any = "Option.none"): Promise<A> => new Promise((resolve, reject) => {
  O.fold(() => reject(reason), resolve)(o);
});
