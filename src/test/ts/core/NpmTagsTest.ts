import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import { BranchState } from '../../../main/ts/core/BranchLogic';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';

const assert = chai.use(chaiAsPromised).assert;
const succeed = PromiseUtils.succeed;

const checkSimple = async (branchName: string, branchState: BranchState, branchTagName: string): Promise<void> => {
  await assert.becomes(
    NpmTags.pickTags(branchName, branchState, PromiseUtils.fail),
    [ branchTagName ]
  );
};

describe('NpmTags', () => {
  describe('pickTags', () => {
    it('uses the branch name for feature branches', () => checkSimple('feature/BLAH-123', BranchState.Feature, 'feature-BLAH-123'));
    it('uses the branch name for spike branches', () => checkSimple('spike/BLAH-123', BranchState.Spike, 'spike-BLAH-123'));
    it('uses the branch name for hotfix branches', () => checkSimple('hotfix/BLAH-123', BranchState.Hotfix, 'hotfix-BLAH-123'));
    it('uses the branch name for main branch', () => checkSimple('main', BranchState.ReleaseCandidate, 'main'));
    it('uses the branch name for rc state', () => checkSimple('hotfix/BLAH-123', BranchState.ReleaseCandidate, 'hotfix-BLAH-123'));

    it('uses the branch name (replacing multiple slashes feature branches',
      () => checkSimple('feature/BLAH/12/3', BranchState.Feature, 'feature-BLAH-12-3')
    );

    it('uses the branch name for release ready state if not the latest release branch', async () => {
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, () => succeed([ 'release/1.3' ])),
        [ 'release-1.2' ]
      );
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, () => succeed([ 'release/1.2', 'release/1.3', 'main' ])),
        [ 'release-1.2' ]
      );
      await assert.becomes(
        NpmTags.pickTags('release/1.2', BranchState.ReleaseReady, () => succeed([ 'release/2.0', 'feature/1.2' ])),
        [ 'release-1.2' ]
      );
    });

    it('uses the branch name and "latest" for release ready state if it is the latest release branch', async () => {
      await assert.becomes(
        NpmTags.pickTags('release/6.7', BranchState.ReleaseReady,
          () => succeed([ 'main', 'frog', 'release/6.7', 'release/6.6', 'feature/1.2' ])),
        [ 'release-6.7', 'latest' ]
      );

      await assert.becomes(
        NpmTags.pickTags('release/8.1', BranchState.ReleaseReady,
          () => succeed([ 'release/8.1', 'main', 'frog', 'release/6.7', 'release/8.0', 'release/6.6', 'feature/1.2' ])),
        [ 'release-8.1', 'latest' ]
      );

      await assert.becomes(
        NpmTags.pickTags('release/8.1', BranchState.ReleaseReady,
          () => succeed([ 'main', 'frog', 'release/6.7', 'release/6.6', 'feature/1.2', 'release/8.1' ])),
        [ 'release-8.1', 'latest' ]
      );
    });

    it('fails if no release branches can be found', async () => {
      await assert.isRejected(NpmTags.pickTags('release/8.1', BranchState.ReleaseReady, () => succeed([])));
    });
  });
});
