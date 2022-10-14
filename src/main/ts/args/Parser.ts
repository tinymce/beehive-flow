import * as yargs from 'yargs';
import * as O from 'fp-ts/Option';
import * as PromiseUtils from '../utils/PromiseUtils';
import { parseMajorMinorVersion } from '../core/Version';
import * as BranchLogic from '../core/BranchLogic';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;
type Option<A> = O.Option<A>;

const prepDescription = 'Branches main as releases/x.y and tweaks versions';

const releaseDescription = 'Sets release/x.y branch to a release version.';

const advanceDescription = 'Advances release/x.y branch to the next prerelease version.';

const advanceCiDescription = 'Advances current checkout to the next prerelease version, if required.';

const stampDescription = 'Adds metadata to version in current checkout';

const publishDescription = 'Publishes package in current directory to NPM. Tags are generated by current git branch.';

const statusDescription = 'Prints out status of current directory.';

const reviveDescription = 'Revives a release/x.y branch from release tags.';

const gitUrlOptions: yargs.Options = {
  type: 'string',
  default: null,
  description: 'URL of git repo to operate on. Defaults to the git repo in the current directory.'
};

const majorMinorOptions: yargs.PositionalOptions = {
  describe: 'major.minor version',
  type: 'string'
};

const majorMinorOrMainOptions: yargs.PositionalOptions = {
  describe: 'major.minor version or "main"',
  type: 'string'
};

const tempOptions: yargs.Options = {
  type: 'string',
  default: null,
  description: 'Temp folder for git checkout. If not specified, a system temp folder is used.'
};

const distDirOptions: yargs.Options = {
  type: 'string',
  default: '.',
  description: 'Dir to use to run "npm publish". Relative to the working-dir. ' +
    'The package.json file in this dir must have the same name and version as the one in the working-dir.'
};

const allowPreReleaseDepsOptions: yargs.Options = {
  description: 'Allow pre-release dependencies when releasing.',
  type: 'boolean',
  default: false
};

const noChangelogReleaseOptions: yargs.Options = {
  description: 'Prevent the changelog from being updated.',
  type: 'boolean',
  default: false
};

const noDiffOptions: yargs.Options = {
  description: 'Prevent the git diff being logged.',
  type: 'boolean',
  default: false
};

const yesOptions: yargs.Options = {
  description: 'Reply yes to any prompts.',
  type: 'boolean',
  default: false,
  alias: 'y'
};

const getColumns = (): number =>
  Math.min(120, yargs.terminalWidth());

const argParser =
  yargs
    .scriptName('beehive-flow')
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Don\'t push changes to remote systems.'
    })
    .option('working-dir', {
      type: 'string',
      default: process.cwd(),
      description: 'working directory - defaults to current directory'
    })
    .command(
      'prepare',
      prepDescription,
      (y) => y
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
    )
    .command(
      'release <majorMinorOrMain>',
      releaseDescription,
      (y) => y
        .positional('majorMinorOrMain', majorMinorOrMainOptions)
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
        .option('allow-pre-releases', allowPreReleaseDepsOptions)
        .option('no-changelog', noChangelogReleaseOptions)
        .option('no-diff', noDiffOptions)
        .option('yes', yesOptions),
    )
    .command(
      'advance <majorMinorOrMain>',
      advanceDescription,
      (y) => y
        .positional('majorMinorOrMain', majorMinorOrMainOptions)
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
    .command(
      'publish',
      publishDescription,
      (y) => y
        .option('dist-dir', distDirOptions)
    )
    .command(
      'status',
      statusDescription
    )
    .command(
      'revive <majorMinor>',
      reviveDescription,
      (y) => y
        .positional('majorMinor', majorMinorOptions)
        .option('git-url', gitUrlOptions)
        .option('temp', tempOptions)
    )
    .demandCommand(1)
    .wrap(getColumns())
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
  let _a: Awaited<ReturnType<typeof argParser.parse>>;
  try {
    _a = await argParser.parse(args);
  } catch (e) {
    // Swallow error, so that the error handler in Main doesn't print it again
    return PromiseUtils.fail('');
  }
  const a = _a;

  if (Boolean(a.help)) {
    return O.none;
  }

  const cmd = a._[0];
  const dryRun = a['dry-run'];
  const workingDir = a['working-dir'];

  const temp = () => O.fromNullable(a.temp as string | null);
  const gitUrl = () => O.fromNullable(a['git-url'] as string | null);

  const majorMinor = async (): Promise<string> => {
    const mm = a.majorMinor as string;
    return BranchLogic.getReleaseBranchName(await parseMajorMinorVersion(mm));
  };

  const majorMinorOrMain = async (): Promise<string> => {
    const mmm = a.majorMinorOrMain as string;
    if (mmm === 'main') {
      return 'main';
    } else {
      const mm = await parseMajorMinorVersion(mmm);
      return BranchLogic.getReleaseBranchName(mm);
    }
  };

  if (cmd === 'prepare') {
    return O.some(BeehiveArgs.prepareArgs(dryRun, workingDir, temp(), gitUrl()));

  } else if (cmd === 'release') {
    return O.some(BeehiveArgs.releaseArgs(
      dryRun,
      workingDir,
      temp(),
      gitUrl(),
      await majorMinorOrMain(),
      a['allow-pre-releases'] as boolean,
      a['no-changelog'] as boolean,
      a['no-diff'] as boolean,
      a.yes as boolean
    ));

  } else if (cmd === 'advance') {
    return O.some(BeehiveArgs.advanceArgs(dryRun, workingDir, temp(), gitUrl(), await majorMinorOrMain()));

  } else if (cmd === 'advance-ci') {
    return O.some(BeehiveArgs.advanceCiArgs(dryRun, workingDir));

  } else if (cmd === 'stamp') {
    return O.some(BeehiveArgs.stampArgs(dryRun, workingDir));

  } else if (cmd === 'publish') {
    return O.some(BeehiveArgs.publishArgs(dryRun, workingDir, a['dist-dir'] as string));

  } else if (cmd === 'status') {
    return O.some(BeehiveArgs.statusArgs(dryRun, workingDir));

  } else if (cmd === 'revive') {
    return O.some(BeehiveArgs.reviveArgs(dryRun, workingDir, temp(), gitUrl(), await majorMinor()));

  } else {
    return PromiseUtils.fail(`Unknown command: ${cmd}`);
  }
};

export const parseProcessArgs = (): Promise<Option<BeehiveArgs>> =>
  parseArgs(getRealArgs());
