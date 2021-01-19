import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import { BranchState } from '../../../main/ts/core/BranchLogic';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';
import { parseVersion } from '../../../main/ts/core/Version';
import * as ArrayUtils from '../../../main/ts/utils/ArrayUtils';

const assert = chai.use(chaiAsPromised).assert;
const succeed = PromiseUtils.succeed;

const checkSimple = async (branchName: string, branchState: BranchState, version: string, expected: string[]): Promise<void> => {
  const v = await parseVersion(version);
  await assert.becomes(
    NpmTags.pickTags(branchName, branchState, v, PromiseUtils.fail),
    expected
  );
};

const assertSorted = <A> (actual: A[], expected: A[]): void => {
  assert.deepEqual(ArrayUtils.sort(actual), ArrayUtils.sort(expected));
};

describe('NpmTags', () => {
  describe('pickTags', () => {
    describe('feature branches', () => {
      it('uses the branch name', () =>
        checkSimple('feature/BLAH-123', BranchState.Feature, '0.1.0', [ 'feature-BLAH-123' ])
      );

      it('replaces multiple slashes', () =>
        checkSimple('feature/BLAH/12/3', BranchState.Feature, '100.7.22', [ 'feature-BLAH-12-3' ])
      );

    });

    describe('spike branches', () => {
      it('uses the branch name', () =>
        checkSimple('spike/BLAH-123', BranchState.Spike, '0.1.7', [ 'spike-BLAH-123' ]));
    });

    describe('hotfix branches', () => {
      it('uses the branch name for hotfix branches', () =>
        checkSimple('hotfix/BLAH-123', BranchState.Hotfix, '0.1.9', [ 'hotfix-BLAH-123' ])
      );

      it('replaces sequences of characters other than alphanumeric/dot/underscore with dashes', () =>
        checkSimple('hotfix/blah_32.7/b**@', BranchState.Hotfix, '0.1.2', [ 'hotfix-blah_32.7-b-' ])
      );
    });

    describe('main branch', () => {
      describe('release ready state', () => {
        it('does not use "latest" if version less than current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('6.7.23'),
              async () => ({ latest: await parseVersion('6.7.24') })),
            [ 'main', 'release-6.7' ]
          );
        });

        it('uses "latest" if version equal to the current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('6.7.22'),
              async () => ({ latest: await parseVersion('6.7.22') })),
            [ 'main', 'release-6.7', 'latest' ]
          );
        });

        it('uses "latest" if version greater than the current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('8.1.0'),
              async () => ({ latest: await parseVersion('8.1.0-rc') })),
            [ 'main', 'release-8.1', 'latest' ]
          );
        });

        it('uses "latest" if current latest is any rc build', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('0.1.11'),
              async () => ({ latest: await parseVersion('0.1.11-rc') })),
            [ 'main', 'release-0.1', 'latest' ]
          );

          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('0.1.11'),
              async () => ({ latest: await parseVersion('400.1.11-rc') })),
            [ 'main', 'release-0.1', 'latest' ]
          );
        });

        it('uses "latest" if there is no existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseReady, await parseVersion('8.1.0'),
              () => succeed({})),
            [ 'main', 'release-8.1', 'latest' ]
          );
        });
      });

      describe('rc state', () => {
        it('uses "latest" for rc state if there is no existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              () => succeed({})),
            [ 'main', 'rc-8.1', 'latest' ]
          );
        });

        it('uses "latest" for rc state if equal to existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.1.0-rc') })),
            [ 'main', 'rc-8.1', 'latest' ]
          );
        });

        it('uses "latest" for rc state if greater to existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.0.99-rc') })),
            [ 'main', 'rc-8.1', 'latest' ]
          );
        });

        it('does not use "latest" for rc state if less than existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.1.1-rc') })),
            [ 'main', 'rc-8.1' ]
          );
        });

        it('does not use "latest" for rc state if latest is a real release', async () => {
          assertSorted(
            await NpmTags.pickTags('main', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('0.0.1') })),
            [ 'main', 'rc-8.1' ]
          );
        });
      });
    });

    describe('release branches', () => {
      it('does not use "latest" for release ready state if not the latest release', async () => {
        assertSorted(
          await NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, await parseVersion('1.2.6'), async () => ({ latest: await parseVersion('1.3.8') })),
          [ 'release-1.2' ]
        );
        assertSorted(
          await NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, await parseVersion('1.2.9'), async () => ({ latest: await parseVersion('2.4.0') })),
          [ 'release-1.2' ]
        );
      });

      it('uses "latest" for release ready state if it version equal to the current latest', async () => {
        assertSorted(
          await NpmTags.pickTags('release/6.7', BranchState.ReleaseReady, await parseVersion('6.7.22'),
            async () => ({ latest: await parseVersion('6.7.22') })),
          [ 'release-6.7', 'latest' ]
        );
      });


      it('uses "latest" for release ready state if version is a release, but current latest is an earlier rc', async () => {
        assertSorted(
          await NpmTags.pickTags('release/0.1', BranchState.ReleaseReady, await parseVersion('0.1.11'),
            async () => ({ latest: await parseVersion('0.1.11-rc') })),
          [ 'release-0.1', 'latest' ]
        );
      });

      it('uses "latest" for release ready state if it is greater than the current latest', async () => {
        assertSorted(
          await NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.0'),
            async () => ({ latest: await parseVersion('8.1.0-rc') })),
          [ 'release-8.1', 'latest' ]
        );
      });

      it('uses "latest" for release ready state if there is no existing "latest" tag', async () => {
        assertSorted(
          await NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.0'),
            () => succeed({})),
          [ 'release-8.1', 'latest' ]
        );
      });

      it('uses "latest" for rc state if there is no existing "latest" tag', async () => {
        assertSorted(
          await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
            () => succeed({})),
          [ 'rc-8.1', 'latest' ]
        );
      });
    });
  });
});
