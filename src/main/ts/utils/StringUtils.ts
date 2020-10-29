/**
 * Show the parameter as a JS literal
 * @param s
 */
export const showStringOrUndefined = (s: string | undefined): string =>
  s === undefined ? 'undefined' : '"' + s.replace('"', '\\"') + '"';
