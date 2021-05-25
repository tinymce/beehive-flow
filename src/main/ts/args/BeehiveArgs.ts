import { Option } from 'fp-ts/Option';

export interface BaseArgs {
  readonly dryRun: boolean;
  readonly workingDir: string;
}

export interface PrepareArgs extends BaseArgs {
  readonly kind: 'PrepareArgs';
  readonly temp: Option<string>;
  readonly gitUrl: Option<string>;
}

export interface ReleaseArgs extends BaseArgs {
  readonly kind: 'ReleaseArgs';
  readonly temp: Option<string>;
  readonly branchName: string;
  readonly gitUrl: Option<string>;
  readonly allowPreReleaseDeps: boolean;
}

export interface AdvanceArgs extends BaseArgs {
  readonly kind: 'AdvanceArgs';
  readonly temp: Option<string>;
  readonly branchName: string;
  readonly gitUrl: Option<string>;
}

export interface AdvanceCiArgs extends BaseArgs {
  readonly kind: 'AdvanceCiArgs';
}

export interface StampArgs extends BaseArgs {
  readonly kind: 'StampArgs';
}

export interface PublishArgs extends BaseArgs {
  readonly kind: 'PublishArgs';
  readonly distDir: string;
}

export interface StatusArgs extends BaseArgs {
  readonly kind: 'StatusArgs';
}

export interface ReviveArgs extends BaseArgs {
  readonly kind: 'ReviveArgs';
  readonly temp: Option<string>;
  readonly branchName: string;
  readonly gitUrl: Option<string>;
}

export const prepareArgs = (dryRun: boolean, workingDir: string, temp: Option<string>, gitUrl: Option<string>): PrepareArgs => ({
  kind: 'PrepareArgs',
  dryRun,
  workingDir,
  temp,
  gitUrl
});

export const releaseArgs = (
  dryRun: boolean, workingDir: string, temp: Option<string>, gitUrl: Option<string>, branchName: string, allowPreReleaseDeps: boolean
): ReleaseArgs => ({
  kind: 'ReleaseArgs',
  dryRun,
  workingDir,
  temp,
  gitUrl,
  branchName,
  allowPreReleaseDeps
});

export const advanceArgs = (
  dryRun: boolean, workingDir: string, temp: Option<string>, gitUrl: Option<string>, branchName: string
): AdvanceArgs => ({
  kind: 'AdvanceArgs',
  dryRun,
  workingDir,
  temp,
  gitUrl,
  branchName
});

export const stampArgs = (dryRun: boolean, workingDir: string): StampArgs => ({
  kind: 'StampArgs',
  workingDir,
  dryRun
});

export const advanceCiArgs = (dryRun: boolean, workingDir: string): AdvanceCiArgs => ({
  kind: 'AdvanceCiArgs',
  dryRun,
  workingDir
});

export const publishArgs = (dryRun: boolean, workingDir: string, distDir: string): PublishArgs => ({
  kind: 'PublishArgs',
  dryRun,
  workingDir,
  distDir
});

export const statusArgs = (dryRun: boolean, workingDir: string): StatusArgs => ({
  kind: 'StatusArgs',
  dryRun,
  workingDir
});

export const reviveArgs = (
  dryRun: boolean, workingDir: string, temp: Option<string>, gitUrl: Option<string>, branchName: string
): ReviveArgs => ({
  kind: 'ReviveArgs',
  dryRun,
  workingDir,
  temp,
  gitUrl,
  branchName
});

export type BeehiveArgs = PrepareArgs | ReleaseArgs | AdvanceArgs | AdvanceCiArgs | StampArgs | PublishArgs | StatusArgs | ReviveArgs;

export const fold = <T>(
  bh: BeehiveArgs,
  ifPrepare: (a: PrepareArgs) => T,
  ifRelease: (a: ReleaseArgs) => T,
  ifAdvance: (a: AdvanceArgs) => T,
  ifAdvanceCi: (a: AdvanceCiArgs) => T,
  ifStamp: (a: StampArgs) => T,
  ifPublish: (a: PublishArgs) => T,
  ifStatus: (a: StatusArgs) => T,
  ifRevive: (a: ReviveArgs) => T
): T => {
  switch (bh.kind) {
    case 'PrepareArgs':
      return ifPrepare(bh);
    case 'ReleaseArgs':
      return ifRelease(bh);
    case 'AdvanceArgs':
      return ifAdvance(bh);
    case 'AdvanceCiArgs':
      return ifAdvanceCi(bh);
    case 'StampArgs':
      return ifStamp(bh);
    case 'PublishArgs':
      return ifPublish(bh);
    case 'StatusArgs':
      return ifStatus(bh);
    case 'ReviveArgs':
      return ifRevive(bh);
  }
};

export const commandName = (bh: BeehiveArgs): string =>
  fold(bh,
    () => 'prepare',
    () => 'release',
    () => 'advance',
    () => 'advance-ci',
    () => 'stamp',
    () => 'publish',
    () => 'status',
    () => 'revive'
  );
