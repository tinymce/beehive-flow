import * as cs from 'cross-spawn-promise';
import * as gitP from 'simple-git/promise';
import { PublishArgs } from '../args/BeehiveArgs';
import { BranchDetails, BranchState, getBranchDetails } from '../core/BranchLogic';
import * as NpmTags from '../core/NpmTags';
import * as Version from '../core/Version';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Git from '../utils/Git';
import { printHeaderMessage } from '../core/Messages';

export const publish = async (args: PublishArgs): Promise<void> => {
  printHeaderMessage(args);
  const dir = args.workingDir;
  const git = gitP(dir);
  const r = await getBranchDetails(dir);

  const tags = await NpmTags.pickTagsGit(r.currentBranch, r.branchState, r.version, git);
  const [ mainTag ] = tags;

  const dryRunArgs = args.dryRun ? [ '--dry-run' ] : [];
  await npmPublish(mainTag, dryRunArgs, dir);
  await npmTag(args, tags, r, dir);
  await gitTag(r, git, args);
};

const npmPublish = async (mainTag: string, dryRunArgs: string[], dir: string): Promise<void> => {
  const publishCmd = [ 'publish', '--tag', mainTag, ...dryRunArgs ];
  console.log([ 'npm', ...publishCmd ].join(' '));
  await cs('npm', publishCmd, { stdio: 'inherit', cwd: dir });
};

const npmTag = async (args: PublishArgs, tags: string[], r: BranchDetails, dir: string): Promise<void> => {
  /*
    Yes, we're setting the mainTag again in this loop.
    If this is the very first publish of a package, the --tag above is ignored
    and "latest" is used. At least on Verdaccio - need to test other NPM registries.
    Even if the extra dist-tag call is not required, it doesn't hurt.
   */
  if (args.dryRun) {
    console.log('dry run - not tagging');
    console.log('Would have added tags: ', tags);
  } else {
    console.log('Setting NPM tags.');
    console.log('This will likely fail a few times, until the package is available in the registry - this is normal.');
    for (const t of tags) {
      const fullPackageName = r.packageJson.name + '@' + Version.versionToString(r.version);
      const tagCmd = [ 'dist-tag', 'add', fullPackageName, t ];
      console.log([ 'npm', ...tagCmd ].join(' '));
      /*
       NPM registries can have a delay after publishing before the package is available.
       If we try and set other tags too early, it'll fail.
       So, retry for a while.
       A 60s timeout was recommended by CloudSmith support. Using 30s for now - might need to increase later.
       In initial testing, CloudSmith packages seemed to be ok after about 4s.
       A side effect of this is that after `beehive-flow publish` is run, we can be sure the package is available
      */
      await PromiseUtils.poll(() => cs('npm', tagCmd, { stdio: 'inherit', cwd: dir }), 30000, 3000);
    }
  }
};

const gitTag = async (r: BranchDetails, git: gitP.SimpleGit, args: PublishArgs): Promise<void> => {
  if (r.branchState === BranchState.releaseReady) {
    const tagName = r.packageJson.name + '@' + Version.versionToString(r.version);
    console.log(`Tagging as ${tagName}`);
    await git.addTag(tagName);

    if (args.dryRun) {
      console.log('Dry run - not pushing tags');
    } else {
      await Git.pushOneTag(git, tagName);
    }
  } else {
    console.log('Not release ready - not git tagging.');
  }
};
