import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

type Either<R, A> = E.Either<R, A>;
type Option<A> = O.Option<A>;

export const eitherToPromise = <R, A> (e: Either<R, A>): Promise<A> => new Promise((resolve, reject) => {
  E.fold(reject, resolve)(e);
});

export const eitherToPromiseVoid = <R, A> (e: Either<R, A>): Promise<void> =>
  voidify(eitherToPromise(e));

export const voidify = <A> (p: Promise<A>): Promise<void> =>
  p.then(() => {});

export const optionToPromise = <R, A> (o: Option<A>, e?: any): Promise<A> => new Promise((resolve, reject) => {
  O.fold(() => reject(e), resolve)(e);
});

export const succeed = <A> (a: A): Promise<A> => new Promise((resolve, reject) => {
  resolve(a);
});

export const fail = <A> (error?: any): Promise<A> => new Promise(((resolve, reject) => {
  reject(error);
}));