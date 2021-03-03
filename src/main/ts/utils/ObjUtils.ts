export const hasKey = (o: object, k: string): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

export const map = <A, B>(o: Record<string, A>, f: (a: A) => B): Record<string, B> => {
  const r: Record<string, B> = {};
  for (const k of Object.keys(o)) {
    r[k] = f(o[k]);
  }
  return r;
};
