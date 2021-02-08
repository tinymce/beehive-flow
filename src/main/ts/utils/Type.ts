export const isString = (x: unknown): x is string =>
  typeof x === 'string';

export const isObject = (x: unknown): x is object =>
  typeof x === 'object' && x !== null;

export const isArray = (x: unknown): x is Array<unknown> =>
  Array.isArray(x);
