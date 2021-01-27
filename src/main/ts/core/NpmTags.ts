import { pipe } from 'fp-ts/pipeable';
import * as O from 'fp-ts/Option';
import * as cs from 'cross-spawn-promise';
import * as PreRelease from '../core/PreRelease';
import { isGte } from '../utils/Comparison';
import * as PromiseUtils from '../utils/PromiseUtils';
import { BranchState } from './BranchLogic';
import { compareVersions, isPreRelease, majorMinorVersionToString, parseVersion, Version } from './Version';

/**
 * Pick NPM tags for the release. There are 3 types of tags:
 *
 * - branch tag: tags based on branch name. On everything except RC builds on release branches.
 * - rc tags: rc-x.y - used on rc builds
 * - latest tag: used on the latest build
 *
 * Note: we tag releases as release-x.y. This seems unnecessary, as you can use package@x.y to refer to it.
 * However, we need to pick at least one tag for each build, otherwise npm publish will tag builds as 'latest'.
 * Adding the release-x.y tag covers a few scenarios where we don't otherwise have a tag to add.
*/
export const pickTags = async (
  branchName: string, branchState: BranchState, version: Version, npmTags: () => Promise<NpmTags>
): Promise<[ string, ...string[] ]> => {

  const branchTag = branchName.replace(/[^\w.]+/g, '-');

  const vs = majorMinorVersionToString(version);

  const rcTagName = () => `${PreRelease.releaseCandidate}-${vs}`;

  const latestTags = await (async () => {
    if (branchState === BranchState.ReleaseCandidate || branchState === BranchState.ReleaseReady) {
      const tags = await npmTags();
      if (shouldTagLatest(version, tags)) {
        return [ 'latest' ];
      }
    }
    return [];
  })();

  const mainTags = ((): [string, ...string[]] => {
    if (branchName === 'main') {
      if (branchState === BranchState.ReleaseCandidate) {
        return [ branchTag, rcTagName() ];

      } else if (branchState === BranchState.ReleaseReady) {
        return [ branchTag, `release-${vs}` ];
      }

    } else if (branchState === BranchState.ReleaseCandidate) {
      // tagging a prerelease as release-x.y would be confusing
      return [ rcTagName() ];
    }
    return [ branchTag ];
  })();

  return [ ...mainTags, ...latestTags ];
};

export const pickTagsNpm = (branchName: string, branchState: BranchState, version: Version, dir: string, packageName: string) =>
  pickTags(branchName, branchState, version, () => getNpmTagsOrNone(dir, packageName));

export type NpmTags = Record<string, Version>;

/**
 * If a package hasn't been published before, getNpmTags will fail. However, we need a list of tags for the first publish.
 * This function falls back to an empty object of tags if getNpmTags fails.
 */
export const getNpmTagsOrNone = (cwd: string, packageName: string): Promise<NpmTags> =>
  PromiseUtils.getOrElse(getNpmTags(cwd, packageName), {});

export const getNpmTags = async (cwd: string, packageName: string): Promise<NpmTags> => {
  const output = await cs('npm', [ 'dist-tag', 'ls', packageName ], { cwd });
  const lines = output.toString().split('\n').filter((x) => x.length > 0);
  const r: Record<string, Version> = {};

  for (const line of lines) {
    const [ tag, version ] = line.split(': ');
    r[tag] = await parseVersion(version);
  }
  return r;
};

export const shouldTagLatestNpm = async (newVersion: Version, cwd: string, packageName: string): Promise<boolean> => {
  const tags = await getNpmTagsOrNone(cwd, packageName);
  return shouldTagLatest(newVersion, tags);
};

export const shouldTagLatest = (newVersion: Version, currentTags: NpmTags): boolean =>
  pipe(
    O.fromNullable(currentTags.latest),
    O.fold(
      () => true,
      (latest) => {
        // All full releases beat all prereleases
        if (isPreRelease(latest) && !isPreRelease(newVersion)) {
          return true;
        } else if (isPreRelease(newVersion) && !isPreRelease(latest)) {
          return false;
        } else {
          return isGte(compareVersions(newVersion, latest));
        }
      }
    )
  );
