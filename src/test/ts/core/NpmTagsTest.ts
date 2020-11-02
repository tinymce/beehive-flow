import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import { BranchState } from '../../../main/ts/core/BranchLogic';
import * as PromiseUtils from '../../../main/ts/utils/PromiseUtils';

const assert = chai.use(chaiAsPromised).assert;

describe('NpmTags', () => {
  describe('pickTags', () => {
    it('uses the branch name for feature branches', async () => {
      await assert.becomes(
        NpmTags.pickTags('feature/BLAH-123', BranchState.Feature, PromiseUtils.fail),
        [ 'feature/BLAH-123' ]
      );
    });
  });

  // TODO: test other conditions
});
