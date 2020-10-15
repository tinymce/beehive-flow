import { MajorMinorVersion } from '../data/Version';

export interface BaseArgs {
  readonly dryRun: boolean;
}

export interface PrepareArgs extends BaseArgs {
  readonly kind: 'PrepareArgs';
}

export interface ReleaseArgs extends BaseArgs {
  readonly kind: 'ReleaseArgs';
  readonly majorMinorVersion: MajorMinorVersion;
}

export interface AdvanceArgs extends BaseArgs {
  readonly kind: 'AdvanceArgs';
  readonly majorMinorVersion: MajorMinorVersion;
}

export interface StampArgs extends BaseArgs {
  readonly kind: 'StampArgs';
}

export const prepareArgs = (dryRun: boolean): PrepareArgs => ({
  kind: 'PrepareArgs',
  dryRun
});

export const releaseArgs = (dryRun: boolean, majorMinorVersion: MajorMinorVersion): ReleaseArgs => ({
  kind: 'ReleaseArgs',
  dryRun,
  majorMinorVersion
});

export const advanceArgs = (dryRun: boolean, majorMinorVersion: MajorMinorVersion): AdvanceArgs => ({
  kind: 'AdvanceArgs',
  dryRun,
  majorMinorVersion
});

export const stampArgs = (dryRun: boolean): StampArgs => ({
  kind: 'StampArgs',
  dryRun
});


export type BeehiveArgs = PrepareArgs | ReleaseArgs | AdvanceArgs | StampArgs;

export const fold = <T>(
  bh: BeehiveArgs,
  ifPrepare: (a: PrepareArgs) => T,
  ifRelease: (a: ReleaseArgs) => T,
  ifAdvance: (a: AdvanceArgs) => T,
  ifStamp: (a: StampArgs) => T
): T => {
  switch (bh.kind) {
    case 'PrepareArgs':
      return ifPrepare(bh);
    case 'ReleaseArgs':
      return ifRelease(bh);
    case 'AdvanceArgs':
      return ifAdvance(bh);
    case 'StampArgs':
      return ifStamp(bh);
  }
};
