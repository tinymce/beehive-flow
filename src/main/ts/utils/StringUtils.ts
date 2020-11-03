// Some of these functions were copied from Katamari. Trying to avoid dependencies on Tiny libraries in this tool.

/**
 * Show the parameter as a JS literal
 * @param s
 */
export const showStringOrUndefined = (s: string | undefined): string =>
  s === undefined ? 'undefined' : '"' + s.replace('"', '\\"') + '"';

export const removeLeading = (str: string, prefix: string): string =>
  str.startsWith(prefix) ? str.substring(prefix.length) : str;
