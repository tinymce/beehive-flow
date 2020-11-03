import * as yargs from 'yargs';
import * as O from 'fp-ts/Option';
import * as PromiseUtils from '../utils/PromiseUtils';
import { parseMajorMinorVersion } from '../core/Version';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;

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

const argParser =
  yargs
    .scriptName('beehive-flow')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems.'
    })
    .option('temp', {
      type: 'string',
      default: null,
      description:
        `Temp folder for git checkout.
        If not specified, a system temp folder is used.`
    })
    .option('git-url', {
      type: 'string',
      default: null,
      description:
        `URL of git repo to operate on. Defaults to the git repo in the current directory.
        Ignored by stamp and advance-ci commands, which always work in current directory.`
    })
    .command(
      'prepare',
      prepDescription
    )
    .command(
      'release <majorDotMinor>',
      releaseDescription, (yargs) => {
        yargs
          .positional('majorDotMinor', {
            describe: 'major.minor version',
            type: 'string'
          });
      }
    )
    .command(
      'advance <majorDotMinor>',
      advanceDescription, (yargs) => {
        yargs
          .positional('majorDotMinor', {
            describe: 'major.minor version',
            type: 'string'
          });
      }
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

export const parseArgs = async (args: string[]): Promise<BeehiveArgs> => {
  let _a;
  try {
    _a = argParser.parse(args);
  } catch (e) {
    // Swallow error, so that the error handler in Main doesn't print it again
    return PromiseUtils.fail('');
  }
  const a = _a;

  const cmd = a._[0];
  const dryRun = a['dry-run'];
  const temp = O.fromNullable(a.temp);
  const gitUrl = O.fromNullable(a['git-url']);

  if (cmd === 'prepare') {
    return BeehiveArgs.prepareArgs(dryRun, temp, gitUrl);

  } else if (cmd === 'release') {
    const mm = await parseMajorMinorVersion(a.majorDotMinor as string);
    return BeehiveArgs.releaseArgs(dryRun, temp, gitUrl, mm);

  } else if (cmd === 'advance') {
    const mm = await parseMajorMinorVersion(a.majorDotMinor as string);
    return BeehiveArgs.advanceArgs(dryRun, temp, gitUrl, mm);

  } else if (cmd === 'advance-ci') {
    return BeehiveArgs.advanceCiArgs(dryRun);

  } else if (cmd === 'stamp') {
    return BeehiveArgs.stampArgs(dryRun);

  } else {
    return PromiseUtils.fail(`Unknown command: ${cmd}`);
  }
};

export const parseProcessArgs = (): Promise<BeehiveArgs> =>
  parseArgs(getRealArgs());
