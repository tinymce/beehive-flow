import * as cp from 'child_process';
import { gitP } from 'simple-git';
import { PublishArgs } from '../args/BeehiveArgs';
import { inspectRepo } from '../core/BranchLogic';
import * as NpmTags from '../core/NpmTags';
import * as Version from '../core/Version';


export const publish = async (args: PublishArgs): Promise<void> => {
  const dir = args.workingDir;
  const git = gitP(dir);
  const r = await inspectRepo(dir);

  const [ mainTag, otherTag ] = await NpmTags.pickTagsGit(r.currentBranch, r.branchState, git);

  const dryRunArgs = args.dryRun ? [ '--dry-run' ] : [];

  const publishCmd = [ 'npm', 'publish', '--tag', mainTag, ...dryRunArgs ].join(' ');

  console.log(publishCmd);

  cp.execSync(publishCmd, { stdio: 'inherit', cwd: dir });

  if (otherTag !== undefined) {
    const fullPackageName = r.packageJson.name + '@' + Version.versionToString(r.version);
    const tagCmd = [ 'npm', 'dist-tag', 'add', fullPackageName ].join(' ');
    cp.execSync(tagCmd, { stdio: 'inherit', cwd: dir });
  }
};
