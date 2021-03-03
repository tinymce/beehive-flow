import { pipe, Predicate, Refinement } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as ParseResult from 'parser-ts/ParseResult';
import * as P from 'parser-ts/Parser';

type Parser<I, O> = P.Parser<I, O>;

/** filter that raises fatal errors if it fails */
export const hardFilter: {
  <A, B extends A>(refinement: Refinement<A, B>): <I>(p: Parser<I, A>) => Parser<I, B>
  <A>(predicate: Predicate<A>): <I>(p: Parser<I, A>) => Parser<I, A>
} = <A>(predicate: Predicate<A>) => <I>(p: Parser<I, A>): Parser<I, A> => (i) =>
  pipe(
    p(i),
    E.chain(next => (predicate(next.value) ? E.right(next) : ParseResult.error(i, undefined, true)))
  );

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
