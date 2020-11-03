import * as yargs from 'yargs';
import * as O from 'fp-ts/Option';
import * as PromiseUtils from '../utils/PromiseUtils';
import { parseMajorMinorVersion } from '../core/Version';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;
type Option<A> = O.Option<A>;

const prepDescription =
  `Branches main as releases/x.y and tweaks versions. 
  Run this command when you are preparing to stabilize "main" as a new release.
  Operates on a fresh clone.`;

const releaseDescription =
  `Changes version in release/x.y branch to a release version. 
  Run this when you are ready to release.
  Operates on a fresh clone.`;

const advanceDescription =
  `Changes version in release/x.y branch to the next prerelease version. 
  Run this once you have completed a release.
  Operates on a fresh clone.`;

const advanceCiDescription =
  `Changes version in release/x.y branch to the next prerelease version, 
  but only if on a release branch in release state.
  Operates on current directory.
  Suitable for running at the end of a CI build.`;

const stampDescription =
  `Changes version in current branch to add the git sha to the prerelease version, if applicable.
  Run this at the start of a CI build. 
  Operates on current directory.
  You should not commit the changes this command makes.`;

const gitUrlOptions: yargs.Options = {
  type: 'string',
  default: null,
  description: 'URL of git repo to operate on. Defaults to the git repo in the current directory.'
};

const majorDotMinorOptions: yargs.PositionalOptions = {
  describe: 'major.minor version',
  type: 'string'
};

const tempOptions: yargs.Options = {
  type: 'string',
  default: null,
  description: 'Temp folder for git checkout. If not specified, a system temp folder is used.'
};

const argParser =
  yargs
    .scriptName('beehive-flow')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems.'
    })
    .command(
      'prepare',
      prepDescription,
      (yargs) => yargs
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
    )
    .command(
      'release <majorDotMinor>',
      releaseDescription,
      (yargs) => yargs
        .positional('majorDotMinor', majorDotMinorOptions)
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
    )
    .command(
      'advance <majorDotMinor>',
      advanceDescription,
      (yargs) => yargs
        .positional('majorDotMinor', majorDotMinorOptions)
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
    )
    .command(
      'advance-ci',
      advanceCiDescription
    )
    .command(
      'stamp',
      stampDescription
    )
    .demandCommand(1)
    .wrap(120)
    .strict()
    .exitProcess(false)
    .parserConfiguration({
      'parse-numbers': false
    });

/**
 Removes the first two args, which are "node" and the script filename
 */
export const getRealArgs = (): string[] =>
  process.argv.slice(2);

export const parseArgs = async (args: string[]): Promise<Option<BeehiveArgs>> => {
  let _a;
  try {
    _a = argParser.parse(args);
  } catch (e) {
    // Swallow error, so that the error handler in Main doesn't print it again
    return PromiseUtils.fail('');
  }
  const a = _a;

  if (a.help) {
    return O.none;
  }

  const cmd = a._[0];
  const dryRun = a['dry-run'];

  const temp = () => O.fromNullable(a.temp as string | null);
  const gitUrl = () => O.fromNullable(a['git-url'] as string | null);
  const majorDotMinor = () => parseMajorMinorVersion(a.majorDotMinor as string);

  if (cmd === 'prepare') {
    return O.some(BeehiveArgs.prepareArgs(dryRun, temp(), gitUrl()));

  } else if (cmd === 'release') {
    return O.some(BeehiveArgs.releaseArgs(dryRun, temp(), gitUrl(), await majorDotMinor()));

  } else if (cmd === 'advance') {
    return O.some(BeehiveArgs.advanceArgs(dryRun, temp(), gitUrl(), await majorDotMinor()));

  } else if (cmd === 'advance-ci') {
    return O.some(BeehiveArgs.advanceCiArgs(dryRun));

  } else if (cmd === 'stamp') {
    return O.some(BeehiveArgs.stampArgs(dryRun));

  } else {
    return PromiseUtils.fail(`Unknown command: ${cmd}`);
  }
};

export const parseProcessArgs = (): Promise<Option<BeehiveArgs>> =>
  parseArgs(getRealArgs());
