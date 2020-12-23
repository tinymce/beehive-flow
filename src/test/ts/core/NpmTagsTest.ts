import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import { BranchState } from '../../../main/ts/core/BranchLogic';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';
import { parseVersion } from '../../../main/ts/core/Version';

const assert = chai.use(chaiAsPromised).assert;
const succeed = PromiseUtils.succeed;

const checkSimple = async (branchName: string, branchState: BranchState, version: string, branchTagName: string): Promise<void> => {
  const v = await parseVersion(version);
  await assert.becomes(
    NpmTags.pickTags(branchName, branchState, v, PromiseUtils.fail),
    [ branchTagName ]
  );
};

describe('NpmTags', () => {
  describe('pickTags', () => {
    it('uses the branch name for feature branches', () => checkSimple('feature/BLAH-123', BranchState.Feature, '0.1.0', 'feature-BLAH-123'));
    it('uses the branch name for spike branches', () => checkSimple('spike/BLAH-123', BranchState.Spike, '0.1.7', 'spike-BLAH-123'));
    it('uses the branch name for hotfix branches', () => checkSimple('hotfix/BLAH-123', BranchState.Hotfix, '0.1.9', 'hotfix-BLAH-123'));
    it('uses the branch name for main branch', () => checkSimple('main', BranchState.Main, '0.1.2', 'main'));

    it('uses the branch name and rc-version for rc state', async () => {
      await assert.becomes(
        NpmTags.pickTags('release/9.12', BranchState.ReleaseCandidate, await parseVersion('9.12.0-rc'), () => succeed([ 'release/9.12' ])),
        [ 'rc-9.12' ]
      );
    });

    it('replaces sequences of characters other than alphanumeric/dot/underscore with dashes', () =>
      checkSimple('hotfix/blah_32.7/b**@', BranchState.Hotfix, '0.1.2', 'hotfix-blah_32.7-b-')
    );

    it('uses the branch name (replacing multiple slashes feature branches',
      () => checkSimple('feature/BLAH/12/3', BranchState.Feature, '100.7.22', 'feature-BLAH-12-3')
    );

    it('uses no tags for release ready state if not the latest release branch', async () => {
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, await parseVersion('1.2.6'), () => succeed([ 'release/1.2', 'release/1.7' ])),
        [ 'release-1.2' ]
      );
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, await parseVersion('1.2.9'), () => succeed([ 'release/1.2', 'release/1.3', 'main' ])),
        [ 'release-1.2' ]
      );
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, await parseVersion('1.2.92'), () => succeed([ 'release/2.0', 'feature/1.2' ])),
        [ 'release-1.2' ]
      );
    });

    it('uses "latest" for release ready state if it is the latest release branch', async () => {
      await assert.becomes(
        NpmTags.pickTags('release/6.7', BranchState.ReleaseReady, await parseVersion('6.7.22'),
          () => succeed([ 'main', 'frog', 'release/6.7', 'release/6.6', 'feature/1.2' ])),
        [ 'release-6.7', 'latest' ]
      );

      await assert.becomes(
        NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.0'),
          () => succeed([ 'release/8.1', 'main', 'frog', 'release/6.7', 'release/8.0', 'release/6.6', 'feature/1.2' ])),
        [ 'release-8.1', 'latest' ]
      );

      await assert.becomes(
        NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.12'),
          () => succeed([ 'main', 'frog', 'release/6.7', 'release/6.6', 'feature/1.2', 'release/8.1' ])),
        [ 'release-8.1', 'latest' ]
      );
    });

    it('fails if no release branches can be found', async () => {
      await assert.isRejected(NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, await parseVersion('8.1.11'), () => succeed([])));
    });
  });
});
