// Some of these functions were copied from Katamari. Trying to avoid dependencies on Tiny libraries in this tool.

/**
 * Show the parameter as a JS literal
 * @param s
 */
export const showStringOrUndefined = (s: string | undefined): string =>
  s === undefined ? 'undefined' : '"' + s.replace('"', '\\"') + '"';

const checkRange = (str: string, substr: string, start: number): boolean =>
  substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;

/** Does 'str' start with 'prefix'?
 *  Note: all strings start with the empty string.
 *        More formally, for all strings x, startsWith(x, "").
 *        This is so that for all strings x and y, startsWith(y + x, y)
 */
export const startsWith = (str: string, prefix: string): boolean =>
  checkRange(str, prefix, 0);

export const removeLeading = (str: string, prefix: string): string =>
  startsWith(str, prefix) ? removeFromStart(str, prefix.length) : str;

const removeFromStart = (str: string, numChars: number): string =>
  str.substring(numChars);
