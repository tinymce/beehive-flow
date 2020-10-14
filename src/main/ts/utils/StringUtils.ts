/**
 * Show the parameter as a JS literal
 * @param s
 */
export const showStringOrUndefined = (s: string | undefined): string =>
  // TODO: test
  s === undefined ? 'undefined' : '"' + s.replace('"', '\\"') + '"';
