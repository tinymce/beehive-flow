import { describe, it } from 'mocha';
import { assert } from 'chai';

import * as Changelog from '../../../main/ts/core/Changelog2';

describe('changelog', () => {
  it('does the needful', () => {
    assert.equal(1, 1);

    const input = `## Changelog`
    Changelog.doParse(input);
  });
});