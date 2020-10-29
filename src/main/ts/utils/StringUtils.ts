// These were copied from Katamari. Trying to avoid dependencies on Tiny libraries in this tool.

/**
 * Show the parameter as a JS literal
 * @param s
 */
export const showStringOrUndefined = (s: string | undefined): string =>
  s === undefined ? 'undefined' : '"' + s.replace('"', '\\"') + '"';
