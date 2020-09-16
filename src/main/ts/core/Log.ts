import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { eqString } from 'fp-ts/Eq';

type Option<A> = O.Option<A>;

export type LogLevel = 'ALL' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'MARK' | 'OFF';

const allLogLevels: LogLevel[] =
  ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'];

export const getLogLevels = (): readonly LogLevel[] =>
  allLogLevels;

export const asLogLevel = (s: string): Option<LogLevel> =>
  A.findFirst((x: LogLevel) => x === s)(allLogLevels);

export const defaultLevel = 'INFO';

export const isLogLevel = (s: string): s is LogLevel =>
  A.elem(eqString)(s)(allLogLevels);
