import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { eqString } from 'fp-ts/Eq';
import * as l4js from 'log4js'

type Option<A> = O.Option<A>;

// restrict the Log interface
export interface Log {
  readonly trace: (message: any, ...args: any[]) => void;
  readonly debug: (message: any, ...args: any[]) => void;
  readonly info: (message: any, ...args: any[]) => void;
  readonly warn: (message: any, ...args: any[]) => void;
  readonly error: (message: any, ...args: any[]) => void;
  readonly fatal: (message: any, ...args: any[]) => void;
  readonly mark: (message: any, ...args: any[]) => void;
}

export type Level = 'ALL' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'MARK' | 'OFF';

const allLevels: Level[] =
  ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'];

export const getAllLevels = (): readonly Level[] =>
  allLevels;

export const asLevel = (s: string): Option<Level> =>
  A.findFirst((x: Level) => x === s)(allLevels);

export const defaultLevel = 'INFO';

export const isLevel = (s: string): s is Level =>
  A.elem(eqString)(s)(allLevels);

export const get = (level: Level): Log => {
  const l = l4js.getLogger();
  l.level = level;
  return l;
};
