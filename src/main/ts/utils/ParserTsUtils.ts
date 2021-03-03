import { pipe, Predicate, Refinement } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as ParseResult from 'parser-ts/ParseResult';
import * as P from 'parser-ts/Parser';
import * as O from 'fp-ts/Option';

type Parser<I, O> = P.Parser<I, O>;
type Option<A> = O.Option<A>;

/** filter that raises fatal errors if it fails */
export const hardFilter: {
  <A, B extends A>(refinement: Refinement<A, B>): <I>(p: Parser<I, A>) => Parser<I, B>
  <A>(predicate: Predicate<A>): <I>(p: Parser<I, A>) => Parser<I, A>
} = <A>(predicate: Predicate<A>) => <I>(p: Parser<I, A>): Parser<I, A> => (i) =>
  pipe(
    p(i),
    E.chain(next => (predicate(next.value) ? E.right(next) : ParseResult.error(i, undefined, true)))
  );

/** Parser that prints its input and result to the console */
export const debug = <I, O> (p: Parser<I, O>): Parser<I, O> => (i) =>
  pipe(
    p(i),
    E.bimap(
      (l) => {
        console.log(i, l);
        return l;
      },
      (r) => {
        console.log(i, r);
        return r;
      }
    )
  );

/** Parser that fails with a message */
export const fail = <I, O> (message: string): Parser<I, O> =>
  P.expected(P.fail(), message);

/** Parser that fails with a message as a fatal error */
export const fatal = <I, O> (message: string): Parser<I, O> =>
  P.cut(P.expected(P.fail(), message));

/** folds over an Optional returned by a parser */
export const foldO = <I, A, B> (ifNone: () => B, ifSome: (a: A) => B) => (p: Parser<I, Option<A>>): Parser<I, B> =>
  pipe(
    p,
    P.map((oa) => pipe(
      oa,
      O.fold(ifNone, ifSome)
    ))
  )