import * as yargs from 'yargs';
import { impossible } from './Impossible';
import * as Log from './Log';

interface BaseArgs {
  readonly dryRun: boolean;
  readonly logLevel: Log.Level;
}

export interface FreezeArgs extends BaseArgs {
  readonly kind: 'freeze';
}

export const freezeArgs = (dryRun: boolean, logLevel: Log.Level): FreezeArgs => ({
  kind: 'freeze',
  dryRun,
  logLevel
});

export type BeehiveArgs = FreezeArgs;

export const fold = <T> (bh: BeehiveArgs, ifFreeze: (dryRun: boolean) => T): T => {
  switch (bh.kind) {
    case 'freeze':
      return ifFreeze(bh.dryRun);
    default:
      return impossible(bh.kind);
  }
};

export const fold_ = <T> (bh: BeehiveArgs, ifFreeze: (f: FreezeArgs) => T): T => {
  switch (bh.kind) {
    case 'freeze':
      return ifFreeze(bh);
    default:
      return impossible(bh.kind);
  }
};

const freezeDescription =
  '\'freezes\' the current master branch, in preparation for merging develop to master. ' +
  'Master will be branched as releases/x.y, some settings tweaked and pushed.';

const argParser =
  yargs
    .scriptName('beehive')
    .option('log-level', {
      type: 'string',
      default: Log.defaultLevel,
      choices: Log.getAllLevels(),
      description: 'Log level'
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems and only make local changes.'
    })
    .command(
      'freeze',
      freezeDescription
    );

/**
Removes the first two args, which are "node" and the script filename
 */
export const getRealArgs = (): string[] =>
  process.argv.slice(2);

export const parseArgs = (args: string[]): Promise<BeehiveArgs> => new Promise((resolve, reject) => {
  const a = argParser
    .strict()
    .parse(args);

  const dryRun = a['dry-run'];
  const logLevel = a['log-level'];

  if (!Log.isLevel(logLevel)) {
    throw new Error('Invalid log level');
  }

  if (a._[0] === 'freeze') {
    resolve(freezeArgs(dryRun, logLevel));
  } else {
    reject();
  }
});

export const parseProcessArgs = (): Promise<BeehiveArgs> =>
  parseArgs(getRealArgs());
