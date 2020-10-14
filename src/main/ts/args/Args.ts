import * as yargs from 'yargs';
import { impossible } from '../utils/Impossible';

interface BaseArgs {
  readonly dryRun: boolean;
}

export interface PrepArgs extends BaseArgs {
  readonly kind: 'prep';
}

export const prepCommand = (dryRun: boolean): PrepArgs => ({
  kind: 'prep',
  dryRun
});

export type BeehiveArgs = PrepArgs;

export const fold = <T> (bh: BeehiveArgs, ifPrep: (dryRun: boolean) => T): T => {
  switch (bh.kind) {
    case 'prep':
      return ifPrep(bh.dryRun);
    default:
      return impossible(bh.kind);
  }
};

export const fold_ = <T> (bh: BeehiveArgs, ifPrep: (f: PrepArgs) => T): T => {
  switch (bh.kind) {
    case 'prep':
      return ifPrep(bh);
    default:
      return impossible(bh.kind);
  }
};

const prepDescription =
  'Branches main as releases/x.y and tweaks versions. Run this command when you are preparing to stabilize "main" as a new release.';

const argParser =
  yargs
    .scriptName('beehive')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems and only make local changes.'
    })
    .command(
      'prep',
      prepDescription
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

  if (a._[0] === 'prep') {
    resolve(prepCommand(a['dry-run']));
  } else {
    reject();
  }
});

export const parseProcessArgs = (): Promise<BeehiveArgs> =>
  parseArgs(getRealArgs());
