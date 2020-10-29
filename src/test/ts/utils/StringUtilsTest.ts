import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as StringUtils from '../../../main/ts/utils/StringUtils';

describe('StringUtils', () => {
  describe('showStringOrUndefined', () => {
    it('shows a string', () => {
      assert.equal('""', StringUtils.showStringOrUndefined(''));
      assert.equal('"a"', StringUtils.showStringOrUndefined('a'));
    });

    it('shows undefined', () => {
      assert.equal('undefined', StringUtils.showStringOrUndefined(undefined));
    });
  });
});
