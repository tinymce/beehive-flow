import kind_of = require('kind-of');

export const isString = (s: unknown): s is string =>
  kind_of(s) === 'string';