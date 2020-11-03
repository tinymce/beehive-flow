import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as StringUtils from '../../../main/ts/utils/StringUtils';

describe('StringUtils', () => {
  describe('startsWith', () => {
    it('starts with a prefix', () => {
      fc.assert(fc.property(fc.asciiString(), fc.asciiString(), (a, b) => {
        assert.isTrue(StringUtils.startsWith(a + b, a));
      }));
    });

    it('does not start with a prefix', () => {
      assert.isFalse(StringUtils.startsWith('abc', 'def'));
    });
  });

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
