import * as E from 'fp-ts/Either';

type Either<R, A> = E.Either<R, A>;

export const rights = <R, A> (eithers: Array<Either<R, A>>): Array<A> => {
  const r: A[] = [];
  for (const e of eithers) {
    if (e._tag === 'Right') {
      r.push(e.right);
    }
  }
  return r;
};

export const combine = <E, T> (eithers: Array<Either<E[], T>>): Either<E[], T[]> => {
  let anyError = false;
  let errors: E[] = [];
  const values: T[] = [];
  for (const e of eithers) {
    if (e._tag === 'Right') {
      values.push(e.right);
    } else if (e._tag === 'Left') {
      errors = errors.concat(e.left);
      anyError = true;
    }
  }
  return anyError ? E.left(errors) : E.right(values);
};