import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as E from 'fp-ts/Either';

import * as Changelog from '../../../main/ts/core/Changelog2';
import { pipe } from 'fp-ts/function';

type Changelog = Changelog.Changelog;

const ramble = `# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

describe('changelog', () => {

  const go = (input: string): E.Either<string, Changelog> =>
    pipe(
      Changelog.doParse(input),
      E.bimap(
        (error) => error.expected.join(','),
        (ok) => ok.value
      )
    );

  it('fails if starts with heading 2', () => {
    assert.deepEqual(go('## Changelog'), E.left('Expected heading 1 with exact text: "Changelog"'));
  });

  it('fails if starts with heading 1 with wrong text', () => {
    assert.isTrue(E.isLeft(Changelog.doParse(`# Changeblog`)));
  });

  it('fails if starts with heading 1 but is missing blurb', () => {
    assert.deepEqual(go(`# Changelog`), E.left('Expected section of text'));
  });

  it('parses changelog header text with Unreleased header (minimum complete example', () => {
    assert.deepEqual(go(`${ramble}
## Unreleased
`
      ), E.right<string, Changelog>({
        unreleased: { sections: [] },
        releases: []
      })
    );
  });

  it('parses changelog header text with Unreleased header and some added entries', () => {
    assert.deepEqual(go(`${ramble}
## Unreleased
### Added
- hello
- there
`
      ), E.right<string, Changelog>({
        unreleased: {
          sections: [
            {
              name: 'Added',
              entries: [ 'hello', 'there' ]
            }
          ]
        },
        releases: []
      })
    );
  });

  it('parses changelog header text with Unreleased header with a newline after unreleased', () => {
    assert.deepEqual(go(`${ramble}
## Unreleased

### Added
- hello
- there
`
      ), E.right<string, Changelog>({
        unreleased: {
          sections: [
            {
              name: 'Added',
              entries: [ 'hello', 'there' ]
            }
          ]
        },
        releases: []
      })
    );
  });

  it('fails with Unreleased header with added and removed in incorrect order', () => {
    assert.deepEqual(go(`${ramble}## Unreleased

### Removed
- hello
- there

### Added
- the thing
`
      ), E.left('Sections in incorrect order (Removed, Added). Correct order is Added, Improved, Changed, Deprecated, Removed, Fixed, Security')
    );
  });

  it('fails with Unreleased header with duplicate removed section', () => {
    assert.deepEqual(go(`${ramble}## Unreleased

### Added
- the thing

### Removed
- hello

### Removed
- hello
`
      ), E.left('Duplicate section name')
    );
  });


});
