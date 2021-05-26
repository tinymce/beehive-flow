import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { BranchState } from '../../../main/ts/core/BranchLogic';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import { parseVersion } from '../../../main/ts/core/Version';
import * as ArrayUtils from '../../../main/ts/utils/ArrayUtils';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';

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

    describe('dependabot branches', () => {
      it('uses the branch name without the ecosystem component', () =>
        checkSimple('dependabot/npm_and_yarn/package-1.0.0', BranchState.Feature, '0.1.0', [ 'dependabot-package-1.0.0' ])
      );

      it('handles other potential dependabot branch names', async () => {
        // See: https://github.com/dependabot/dependabot-core/blob/f26fefadcab70067e3184c0c8743d359d35abd39/common/lib/dependabot/config/file.rb#L40
        await checkSimple('dependabot/nuget/package-1.0.0', BranchState.Feature, '0.1.0', [ 'dependabot-package-1.0.0' ]);
        await checkSimple('dependabot/pip/web/package-3.1.8', BranchState.Feature, '0.1.0', [ 'dependabot-web-package-3.1.8' ]);
        await checkSimple('dependabot/maven/package-0.1.0', BranchState.Feature, '0.1.0', [ 'dependabot-package-0.1.0' ]);
        await checkSimple('dependabot/composer/package-3.4.2', BranchState.Feature, '0.1.0', [ 'dependabot-package-3.4.2' ]);
        await checkSimple('dependabot/cargo/package-0.0.5', BranchState.Feature, '0.1.0', [ 'dependabot-package-0.0.5' ]);
      });
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

    describe('release branch', () => {
      describe('release ready state', () => {
        it('does not use "latest" if version less than current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('release/6.7', BranchState.ReleaseReady, await parseVersion('6.7.23'),
              async () => ({ latest: await parseVersion('6.7.24') })),
            [ 'release-6.7' ]
          );
        });

        it('uses "latest" if version equal to the current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('release/6.7', BranchState.ReleaseReady, await parseVersion('6.7.22'),
              async () => ({ latest: await parseVersion('6.7.22') })),
            [ 'release-6.7', 'latest' ]
          );
        });

        it('uses "latest" if version greater than the current latest', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.0'),
              async () => ({ latest: await parseVersion('8.1.0-rc') })),
            [ 'release-8.1', 'latest' ]
          );
        });

        it('uses "latest" if current latest is any rc build', async () => {
          assertSorted(
            await NpmTags.pickTags('release/0.1', BranchState.ReleaseReady, await parseVersion('0.1.11'),
              async () => ({ latest: await parseVersion('0.1.11-rc') })),
            [ 'release-0.1', 'latest' ]
          );

          assertSorted(
            await NpmTags.pickTags('release/0.1', BranchState.ReleaseReady, await parseVersion('0.1.11'),
              async () => ({ latest: await parseVersion('400.1.11-rc') })),
            [ 'release-0.1', 'latest' ]
          );
        });

        it('uses "latest" if there is no existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.0'),
              () => succeed({})),
            [ 'release-8.1', 'latest' ]
          );
        });
      });

      describe('rc state', () => {
        it('uses "latest" for rc state if there is no existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              () => succeed({})),
            [ 'rc-8.1', 'latest' ]
          );
        });

        it('uses "latest" for rc state if equal to existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.1.0-rc') })),
            [ 'rc-8.1', 'latest' ]
          );
        });

        it('uses "latest" for rc state if greater to existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.0.99-rc') })),
            [ 'rc-8.1', 'latest' ]
          );
        });

        it('does not use "latest" for rc state if less than existing "latest" tag', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('8.1.1-rc') })),
            [ 'rc-8.1' ]
          );
        });

        it('does not use "latest" for rc state if latest is a real release', async () => {
          assertSorted(
            await NpmTags.pickTags('release/8.1', BranchState.ReleaseCandidate, await parseVersion('8.1.0-rc'),
              async () => ({ latest: await parseVersion('0.0.1') })),
            [ 'rc-8.1' ]
          );
        });
      });
    });

    describe('arbitrary branches', () => {
      const specialChar = () => fc.char().filter((char) => !/[\w.]/.test(char));
      const alphanumeric = () => fc.char().filter((char) => /\w/.test(char));

      it('arbitrary branch names should collapse special characters', () =>
        fc.assert(fc.asyncProperty(fc.stringOf(alphanumeric(), { minLength: 1 }), fc.stringOf(specialChar(), { minLength: 1 }), (str, special) =>
          checkSimple(`${str}${special}${str}`, BranchState.Spike, '0.1.5', [ `${str}-${str}` ])
        ))
      );

      it('arbitrary dependabot prefixed branch names', () =>
        fc.assert(fc.asyncProperty(fc.stringOf(alphanumeric(), { minLength: 1 }), fc.lorem(), (str, lorem) =>
          checkSimple(`dependabot/${str}/${lorem}`, BranchState.Feature, '1.5.2', [ `dependabot-${lorem.replace(/ /g, '-')}` ])
        ))
      );
    });
  });
});
