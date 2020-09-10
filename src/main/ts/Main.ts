import * as yargs from 'yargs';

interface FreezeCommand {
  kind: 'freeze'
}

const freezeCommand = (): FreezeCommand => ({
  kind: 'freeze'
});

type BeehiveCommand = FreezeCommand;

const argParser =
  yargs
    .scriptName('beehive')
    .demandCommand(1)
    .command("freeze", "freezes the master branch");

const getRealArgs = (): string[] =>
  process.argv.slice(2)

const parseArgs = (args: string[]): Promise<BeehiveCommand> => new Promise((resolve, reject) => {
  const a: { _: string[]; $0: string } = argParser
  .strict()
  .parse(args);

  if (a._[0] === 'freeze') {
    resolve(freezeCommand());
  } else {
    reject();
  }
});

console.log(parseArgs(getRealArgs()));

