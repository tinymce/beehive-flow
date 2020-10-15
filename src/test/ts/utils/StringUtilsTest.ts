import { describe, it } from 'mocha';
import { assert } from 'chai';
import fc from 'fast-check';
import * as StringUtils from '../../../main/ts/utils/StringUtils';

describe('StringUtils', () => {
  describe('endsWith', () => {
    it('ends with a suffix', () => {
      fc.assert(fc.property(fc.asciiString(), fc.asciiString(), (a, b) => {
        assert.isTrue(StringUtils.startsWith(a + b, a));
      }));
    });

    it('does not end with a not suffix', () => {
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
