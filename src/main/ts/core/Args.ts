import * as yargs from 'yargs';
import { impossible } from './Impossible';
import * as Log from './Log';
import { LogLevel } from './Log';

interface BaseCommand {
  readonly dryRun: boolean;
  readonly logLevel: LogLevel;
}

export interface FreezeCommand extends BaseCommand {
  readonly kind: 'freeze';
}

export const freezeCommand = (dryRun: boolean, logLevel: LogLevel): FreezeCommand => ({
  kind: 'freeze',
  dryRun,
  logLevel
});

export type BeehiveCommand = FreezeCommand;

export const fold = <T> (bh: BeehiveCommand, ifFreeze: (dryRun: boolean) => T): T => {
  switch (bh.kind) {
    case 'freeze':
      return ifFreeze(bh.dryRun);
    default:
      return impossible(bh.kind);
  }
};

export const fold_ = <T> (bh: BeehiveCommand, ifFreeze: (f: FreezeCommand) => T): T => {
  switch (bh.kind) {
    case 'freeze':
      return ifFreeze(bh);
    default:
      return impossible(bh.kind);
  }
};

const argParser =
  yargs
    .scriptName('beehive')
    .option('loglevel', {
      type: 'string',
      default: Log.defaultLevel,
      choices: Log.getLogLevels(),
      description: 'Log level'
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems and only make local changes.'
    })
    .command(
      'freeze',
      '\'freezes\' the current master branch, in preparation for merging develop to master. Master will be branched as releases/x.y, some settings tweaked and pushed.'
    );

/**
Removes the first two args, which are "node" and the script filename
 */
export const getRealArgs = (): string[] =>
  process.argv.slice(2);

export const parseArgs = (args: string[]): Promise<BeehiveCommand> => new Promise((resolve, reject) => {
  const a = argParser
    .strict()
    .parse(args);

  const dryRun = a['dry-run'];
  const logLevel = a['loglevel'];

  if (!Log.isLogLevel(logLevel)) {
    throw new Error('Invalid log level');
  }

  if (a._[0] === 'freeze') {
    resolve(freezeCommand(dryRun, logLevel));
  } else {
    reject();
  }
});

export const parseProcessArgs = (): Promise<BeehiveCommand> =>
  parseArgs(getRealArgs());
