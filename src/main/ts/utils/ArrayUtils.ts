export const sort = <T> (ts: T[], compareFn?: (a: T, b: T) => number): T[] =>
  [ ...ts ].sort(compareFn);
