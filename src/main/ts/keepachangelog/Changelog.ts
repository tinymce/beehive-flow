import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as KeepAChangelog from 'keep-a-changelog';
import { Semver } from 'keep-a-changelog/types/src/deps';
import { DateTime } from 'luxon';
import * as Version from '../core/Version';
import * as Files from '../utils/Files';

export interface Changelog extends KeepAChangelog.Changelog {
  releases: CustomRelease[];
  addRelease(release: CustomRelease): this;
  findRelease(version?: Semver | string): CustomRelease | undefined;
  tagName(release: CustomRelease): string;
}

export type Release = KeepAChangelog.Release;
export type Change = KeepAChangelog.Change;

class CustomRelease extends KeepAChangelog.Release {
  public constructor(version?: Semver | string, date?: Date | string, description?: string) {
    super(version, date, description);
    // Add in "improved" and ensure the ordering
    const changeTypes: Array<[ string, Change[] ]> = [
      [ 'added', []],
      [ 'improved', []],
      [ 'changed', []],
      [ 'fixed', []],
      [ 'security', []],
      [ 'deprecated', []],
      [ 'removed', []]
    ];

    this.changes = new Map(changeTypes);
  }

  public improved(change: Change) {
    return this.addChange('improved', change);
  }

  public toString(changelog?: Changelog): string {
    // Ensure new lines between the version header and section header
    return super.toString(changelog).replace(/## (.+)\n###/g, '## $1\n\n###');
  }
}

// Attempt to find the specific release if not fallback to finding the unreleased section
const findRelease = (changelog: Changelog, version: string): O.Option<CustomRelease> =>
  O.fromNullable(changelog.findRelease(version) ?? changelog.findRelease());

export const parse = (content: string): Changelog =>
  KeepAChangelog.parser(content, {
    releaseCreator: (version?: string, date?: string, description?: string) => new CustomRelease(version, date, description)
  }) as Changelog;

export const update = (content: string, version: Version.Version) => {
  const versionString = Version.versionToString(version);
  const date = DateTime.now();
  const dateString = date.toFormat('yyyy-MM-dd');
  const changelog = parse(content);

  // Find the current version, if not find unreleased and update the version
  const release = pipe(
    findRelease(changelog, versionString),
    O.filter((current) => !current.isEmpty()),
    O.map((current) => {
      const isUnreleased = current.version === undefined;
      if (isUnreleased) {
        console.log(`Changing unreleased changelog header to ${versionString} - ${dateString}`);
        current.setVersion(versionString);
        changelog.addRelease(new CustomRelease());
      } else {
        console.log(`Updating existing changelog header to ${versionString} - ${dateString}`);
      }
      current.setDate(date.toJSDate());
      return current;
    })
  );

  return O.isSome(release) ? changelog.toString() : content;
};

export const updateFromFile = async (changelogFile: string, version: Version.Version) => {
  const content = await Files.readFileAsString(changelogFile);
  const newContent = update(content, version);
  console.log(`Saving changes to ${changelogFile}`);
  await Files.writeFile(changelogFile, newContent);
};