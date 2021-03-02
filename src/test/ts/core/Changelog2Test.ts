import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as E from 'fp-ts/Either';

import * as Changelog from '../../../main/ts/core/Changelog2';

describe('changelog', () => {
  it('fails if starts with heading 2', () => {
    assert.isTrue(E.isLeft(Changelog.doParse(`## Changelog`)));
  });

  it('passes if starts with heading 1', () => {
    assert.isTrue(E.isRight(Changelog.doParse(`# Changelog`)));
  });

  it('fails if starts with heading 1 with wrong text', () => {
    assert.isTrue(E.isLeft(Changelog.doParse(`# Changeblog`)));
  });
});