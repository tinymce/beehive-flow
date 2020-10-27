import * as Version from '../core/Version';
import * as PackageJson from './PackageJson';

type MajorMinorVersion = Version.MajorMinorVersion;
type Version = Version.Version;
type PackageJson = PackageJson.PackageJson;

export interface BaseRepoState {
  readonly gitUrl: string;
  readonly currentBranch: string;
  readonly version: Version;
  readonly majorMinorVersion: MajorMinorVersion;
  readonly packageJson: PackageJson;
  readonly packageJsonFile: string;
}

export interface Main extends BaseRepoState {
  readonly kind: 'Main';
}

export interface ReleaseCandidate extends BaseRepoState {
  readonly kind: 'ReleaseCandidate';
}

export interface Release extends BaseRepoState {
  readonly kind: 'Release';
}

export interface Feature extends BaseRepoState {
  readonly kind: 'Feature';
  readonly code: string;
}

export interface Hotfix extends BaseRepoState {
  readonly kind: 'Hotfix';
  readonly code: string;
}

export type RepoState = Main | ReleaseCandidate | Release | Feature | Hotfix;
