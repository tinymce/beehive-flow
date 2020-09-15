import * as yargs from 'yargs';
import { impossible } from './Impossible';

interface BaseCommand {
  readonly dryRun: boolean;
}

export interface FreezeCommand extends BaseCommand {
  readonly kind: 'freeze'
}

export const freezeCommand = (dryRun: boolean): FreezeCommand => ({
  kind: 'freeze',
  dryRun
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
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push to upstream git repo.'
    })
    .command(
      "freeze",
      "'freezes' the current master branch, in preparation for merging develop to master. Master will be branched as releases/x.y, some settings tweaked and pushed."
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

  if (a._[0] === 'freeze') {
    resolve(freezeCommand(a['dry-run']));
  } else {
    reject();
  }
});

export const parseProcessArgs = async () =>
  await parseArgs(getRealArgs())
