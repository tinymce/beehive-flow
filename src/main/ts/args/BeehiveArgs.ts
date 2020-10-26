import { Option } from 'fp-ts/Option';
import { MajorMinorVersion } from '../core/Version';

export interface BaseArgs {
  readonly dryRun: boolean;
  readonly temp: Option<string>;
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

export const prepareArgs = (dryRun: boolean, temp: Option<string>): PrepareArgs => ({
  kind: 'PrepareArgs',
  dryRun,
  temp
});

export const releaseArgs = (dryRun: boolean, temp: Option<string>, majorMinorVersion: MajorMinorVersion): ReleaseArgs => ({
  kind: 'ReleaseArgs',
  dryRun,
  temp,
  majorMinorVersion
});

export const advanceArgs = (dryRun: boolean, temp: Option<string>, majorMinorVersion: MajorMinorVersion): AdvanceArgs => ({
  kind: 'AdvanceArgs',
  dryRun,
  temp,
  majorMinorVersion
});

export const stampArgs = (dryRun: boolean, temp: Option<string>): StampArgs => ({
  kind: 'StampArgs',
  temp,
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
