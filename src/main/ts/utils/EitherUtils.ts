import * as E from 'fp-ts/Either';

type Either<R, A> = E.Either<R, A>;

export const rights = <R, A> (eithers: Array<Either<R, A>>): Array<A> => {
  const r: A[] = [];
  for (const e of eithers) {
    if (E.isRight(e)) {
      r.push(e.right);
    }
  }
  return r;
};
