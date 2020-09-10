import * as yargs from 'yargs';


const argParser =
  yargs
    .scriptName('beehive')
    .command("freeze", "freezes the master branch");

const getRealArgs = (): string[] =>
  process.argv.slice(1)

const go = (args: string[]): void => {
  argParser
    .demandCommand(1)
    .strict()
    .parse(args);
};

go(getRealArgs());
