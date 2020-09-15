import * as yargs from 'yargs';
import { impossible } from './Impossible';

export interface FreezeCommand {
  readonly kind: 'freeze'
}

export const freezeCommand = (): FreezeCommand => ({
  kind: 'freeze'
});

export type BeehiveCommand = FreezeCommand;

export const fold = <T> (bh: BeehiveCommand, ifFreeze: () => T): T => {
  switch (bh.kind) {
    case 'freeze':
      return ifFreeze();
    default:
      return impossible(bh.kind);
  }
}

const argParser =
  yargs
  .scriptName('beehive')
  .demandCommand(1)
  .command("freeze", "'freezes' the current master branch, in preparation for merging develop to master. Master will be branched as releases/x.y, some settings tweaked and pushed.");

/**
Removes the first two args, which are "node" and the script filename
 */
export const getRealArgs = (): string[] =>
  process.argv.slice(2);

export const parseArgs = (args: string[]): Promise<BeehiveCommand> => new Promise((resolve, reject) => {
  const a: { _: string[]; $0: string } = argParser
  .strict()
  .parse(args);

  if (a._[0] === 'freeze') {
    resolve(freezeCommand());
  } else {
    reject();
  }
});

export const parseProcessArgs = async () =>
  await parseArgs(getRealArgs())
