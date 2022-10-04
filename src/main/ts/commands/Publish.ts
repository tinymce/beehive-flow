import cs from 'cross-spawn-promise';
import { gitP, SimpleGit } from 'simple-git';
import { PublishArgs } from '../args/BeehiveArgs';
import { BranchDetails, BranchState, getBranchDetails, Module } from '../core/BranchLogic';
import * as NpmTags from '../core/NpmTags';
import * as Version from '../core/Version';
import * as Changelog from '../keepachangelog/Changelog';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as Git from '../utils/Git';
import { printHeaderMessage } from '../core/Messages';

export const publish = async (args: PublishArgs): Promise<void> => {
  printHeaderMessage(args);
  const dir = args.workingDir;
  const git = gitP(dir);
  const r = await getBranchDetails(dir);

  await checkVersion(r.version, r.rootModule);

  const tags = await NpmTags.pickTagsNpm(r.currentBranch, r.branchState, r.version, dir, r.rootModule.packageJson.name);
  const [ mainTag ] = tags;

  const dryRunArgs = args.dryRun ? [ '--dry-run' ] : [];
  await npmPublish(mainTag, dryRunArgs, args.workingDir, args.distDir);
  await npmTag(args, tags, r, args.workingDir);
  await gitTag(r, git, args);
};

const checkVersion = async (version: Version.Version, module: Module): Promise<void> => {
  if (module.changelogFormat === 'keepachangelog') {
    await Changelog.checkVersionFromFile(module.changelogFile, version);
  }
};

const npmPublish = async (mainTag: string, dryRunArgs: string[], dir: string, distDir: string): Promise<void> => {
  const publishCmd = [ 'publish', distDir, '--tag', mainTag, ...dryRunArgs ];
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
      const fullPackageName = r.rootModule.packageJson.name + '@' + Version.versionToString(r.version);
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

const gitTag = async (r: BranchDetails, git: SimpleGit, args: PublishArgs): Promise<void> => {
  if (r.branchState === BranchState.ReleaseReady) {

    // TODO TINY-6994: Implement tagging logic:
    /*
      Tag X.Y.Z for the primary module in a repo.
      In a single-module repo this will be the one and only module.
      For a multi-project repos this might be the root module (which might not be published) or a special project.
      Tag package@X.Y.Z for all modules other than the primary.
     */
    // const tagName = r.packageJson.name + '@' + Version.versionToString(r.version);
    const tagName = Version.versionToString(r.version);

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
