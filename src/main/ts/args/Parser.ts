import * as yargs from 'yargs';
import * as BeehiveArgs from './BeehiveArgs';
import * as Version from '../data/Version';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;
type MajorMinorVersion = Version.MajorMinorVersion;

const prepDescription =
  'Branches main as releases/x.y and tweaks versions. Run this command when you are preparing to stabilize "main" as a new release.';

const releaseDescription =
  'Changes version in release/x.y branch to a release version. Run this when you are ready to release.';

const advanceDescription =
  'Changes version in release/x.y branch to the next prerelease version. Run this once you have completed a release.'

const stampDescription =
  'Changes version in current branch to add the git sha to the prerelease version. Run this at the start of a build. Don\'t commit the changes.'

const argParser =
  yargs
    .scriptName('beehive')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems and only make local changes.'
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
            coerce: Version.parseMajorMinorVersionOrDie
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
            coerce: Version.parseMajorMinorVersionOrDie
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
      .parse(args);

    console.log(a);

    const dryRun = a['dry-run'];

    if (a._[0] === 'prepare') {
      resolve(BeehiveArgs.prepareArgs(dryRun));

    } else if (a._[0] === 'release') {
      const mm = a['majorMinorVersion'] as MajorMinorVersion;
      resolve(BeehiveArgs.releaseArgs(dryRun, mm));

    } else if (a._[0] === 'advance') {
      const mm = a['majorMinorVersion'] as MajorMinorVersion;
      resolve(BeehiveArgs.advanceArgs(dryRun, mm));

    } else if (a._[0] === 'stamp') {
      resolve(BeehiveArgs.stampArgs(dryRun));

    } else {
      reject();
    }
  });

export const parseProcessArgs = (): Promise<BeehiveArgs> =>
  parseArgs(getRealArgs());
