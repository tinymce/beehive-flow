import { Option } from 'fp-ts/Option';
import { MajorMinorVersion } from '../core/Version';

export interface BaseArgs {
  readonly dryRun: boolean;
}

export interface PrepareArgs extends BaseArgs {
  readonly kind: 'PrepareArgs';
  readonly temp: Option<string>;
  readonly gitUrl: Option<string>;
}

export interface ReleaseArgs extends BaseArgs {
  readonly kind: 'ReleaseArgs';
  readonly temp: Option<string>;
  readonly majorMinorVersion: MajorMinorVersion;
  readonly gitUrl: Option<string>;
}

export interface AdvanceArgs extends BaseArgs {
  readonly kind: 'AdvanceArgs';
  readonly temp: Option<string>;
  readonly majorMinorVersion: MajorMinorVersion;
  readonly gitUrl: Option<string>;
}

export interface StampArgs extends BaseArgs {
  readonly kind: 'StampArgs';
}

export const prepareArgs = (dryRun: boolean, temp: Option<string>, gitUrl: Option<string>): PrepareArgs => ({
  kind: 'PrepareArgs',
  dryRun,
  temp,
  gitUrl
});

export const releaseArgs = (dryRun: boolean, temp: Option<string>, gitUrl: Option<string>, majorMinorVersion: MajorMinorVersion): ReleaseArgs => ({
  kind: 'ReleaseArgs',
  dryRun,
  temp,
  gitUrl,
  majorMinorVersion
});

export const advanceArgs = (dryRun: boolean, temp: Option<string>, gitUrl: Option<string>, majorMinorVersion: MajorMinorVersion): AdvanceArgs => ({
  kind: 'AdvanceArgs',
  dryRun,
  temp,
  gitUrl,
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
