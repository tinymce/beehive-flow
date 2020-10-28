import { describe, it } from 'mocha';
import fc from 'fast-check';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as BranchLogic from '../../../main/ts/core/BranchLogic';

const assert = chai.use(chaiAsPromised).assert;

describe('BranchLogic', () => {
  describe('releaseBranchName', () => {
    it('makes branch names (manual cases)', () => {
      assert.equal(BranchLogic.releaseBranchName({ major: 1, minor: 2 }), 'release/1.2');
      assert.equal(BranchLogic.releaseBranchName({ major: 0, minor: 0 }), 'release/0.0');
    });
    it('makes branch names (property)', () => {
      fc.assert(fc.property(fc.nat(1000), fc.nat(1000), (major, minor) => {
        assert.equal(BranchLogic.releaseBranchName({ major, minor }), `release/${major}.${minor}`);
      }));
    });
  });
  describe('versionFromReleaseBranch', () => {
    it('parses versions', () => {
      fc.assert(fc.asyncProperty(fc.nat(1000), fc.nat(1000), async (major, minor) => {
        await assert.becomes(
          BranchLogic.versionFromReleaseBranch(`release/${major}.${minor}`),
          { major, minor }
        );
      }));
    });
  });
});

