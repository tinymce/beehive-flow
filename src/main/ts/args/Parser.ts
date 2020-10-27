import * as yargs from 'yargs';
import * as O from 'fp-ts/Option';
import * as Version from '../core/Version';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;
type MajorMinorVersion = Version.MajorMinorVersion;

const prepDescription =
  'Branches main as releases/x.y and tweaks versions. Run this command when you are preparing to stabilize "main" as a new release.';

const releaseDescription =
  'Changes version in release/x.y branch to a release version. Run this when you are ready to release.';

const advanceDescription =
  'Changes version in release/x.y branch to the next prerelease version. Run this once you have completed a release.';

const stampDescription =
  'Changes version in current branch to add the git sha to the prerelease version, if applicable. ' +
  'Also validates versions. Run this at the start of a build. Don\'t commit the changes.';

const argParser =
  yargs
    .scriptName('beehive-flow')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems and only make local changes.'
    })
    .option('temp', {
      type: 'string',
      default: null,
      description:
        'Temp folder for git checkout. Useful for keeping within a workspace in a CI server. ' +
        'If not specified, a system temp folder is used.'
    })
    .option('git-url', {
      type: 'string',
      default: null,
      description:
        'URL of git repo to operate on. Defaults to the git repo in the current directory. ' +
        'Ignored by stamp command, which always works in current directory.'
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
            type: 'string',
            coerce: Version.parseMajorMinorVersionOrThrow
          });
      }
    )
    .command(
      'advance <majorDotMinor>',
      advanceDescription, (yargs) => {
        yargs
          .positional('majorDotMinor', {
            describe: 'major.minor version',
            type: 'string',
            coerce: Version.parseMajorMinorVersionOrThrow
          });
      }
    )
    .command(
      'stamp',
      stampDescription
    )
    .demandCommand(1)
    .wrap(120);

/**
 Removes the first two args, which are "node" and the script filename
 */
export const getRealArgs = (): string[] =>
  process.argv.slice(2);

export const parseArgs = (args: string[]): Promise<BeehiveArgs> => new Promise((resolve, reject) => {
  const a = argParser
    .strict()
    .exitProcess(false)
    .parserConfiguration({
      'parse-numbers': false
    })
    .parse(args);

  const dryRun = a['dry-run'];
  const temp = O.fromNullable(a.temp);
  const gitUrl = O.fromNullable(a['git-url']);

  if (a._[0] === 'prepare') {
    resolve(BeehiveArgs.prepareArgs(dryRun, temp, gitUrl));

  } else if (a._[0] === 'release') {
    const mm = a.majorDotMinor as MajorMinorVersion;
    resolve(BeehiveArgs.releaseArgs(dryRun, temp, gitUrl, mm));

  } else if (a._[0] === 'advance') {
    const mm = a.majorDotMinor as MajorMinorVersion;
    resolve(BeehiveArgs.advanceArgs(dryRun, temp, gitUrl, mm));

  } else if (a._[0] === 'stamp') {
    resolve(BeehiveArgs.stampArgs(dryRun));

  } else {
    reject();
  }
});

export const parseProcessArgs = (): Promise<BeehiveArgs> =>
  parseArgs(getRealArgs());

// TODO: add a parameter that tells beehive to keep temp checkouts.
