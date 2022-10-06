/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as E from 'fp-ts/Either';
import { describe, it } from 'mocha';
import { assert } from 'chai';
import { DateTime } from 'luxon';
import * as Files from '../../../main/ts/utils/Files';
import { Version } from '../../../main/ts/core/Version';
import * as Changelog from '../../../main/ts/keepachangelog/Changelog';

const preamble = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`;

describe('Changelog', () => {
  const createVersion = (major: number, minor: number, patch: number) =>
    ({ major, minor, patch });

  context('update', () => {
    const today = DateTime.now().toFormat('yyyy-MM-dd');

    const go = (input: string, newVersion?: Version): string =>
      Changelog.update(input, newVersion ?? createVersion(1, 0, 0));

    it('does nothing with only changelog header with no releases', () => {
      assert.deepEqual(go(preamble), preamble);
    });

    it('does nothing with only changelog header text and Unreleased header (minimum complete example)', () => {
      const content = `${preamble}
## Unreleased
`;
      assert.deepEqual(go(content), content);
    });

    it('updates with only a Unreleased header and content', () => {
      const content = `${preamble}
## Unreleased

### Added
- Content
`;

      const expected = `${preamble}
## Unreleased

## 1.0.0 - ${today}

### Added
- Content
`;
      assert.deepEqual(go(content), expected);
    });

    it('updates an existing header with the right date', () => {
      const content = `${preamble}
## 1.0.0 - 2001-01-01

### Added
- Content

### Improved
- Content
`;

      const expected = `${preamble}
## 1.0.0 - ${today}

### Added
- Content

### Improved
- Content
`;
      assert.deepEqual(go(content), expected);
    });

    it('fails with a release header without a date', () => {
      assert.throws(() => {
        go(`${preamble}
## 1.0.0

### Removed
- Content
`);
      });
    });
  });

  context('parse', () => {
    it('can parse a valid changelog entry', async () => {
      const content = await Files.readFileAsString('src/test/data/keepachangelog/test_ok_standard.md');
      const changelog = Changelog.parse(content);
      assert.lengthOf(changelog.releases, 4, 'Number of releases');
      assert.isUndefined(changelog.releases[0].version, 'An unreleased section exists');
      assert.equal(changelog.releases[1].version?.compare('5.6.2'), 0);
      assert.equal(changelog.releases[3].version?.compare('5.6.0'), 0);
      assert.lengthOf(changelog.releases[3].changes.get('added')!, 11, 'Added entries');
      assert.lengthOf(changelog.releases[3].changes.get('improved')!, 1, 'Improved entries');
      assert.lengthOf(changelog.releases[3].changes.get('changed')!, 1, 'Changed entries');
      assert.lengthOf(changelog.releases[3].changes.get('fixed')!, 27, 'Fixed entries');
      assert.lengthOf(changelog.releases[3].changes.get('security')!, 1, 'Security entries');
    });
  });

  context('checkVersion', () => {
    it('should pass for a patch release with "Fixed" or "Security"', () => {
      assert.deepEqual(Changelog.checkVersion(`${preamble}
## Unreleased

### Fixed
- Fixed some bug

### Security
- Some security issue
`, createVersion(1, 0, 1)), E.right(true));
    });

    it('should pass for a minor release with "Changed", "Fixed", "Added" or "Improved"', () => {
      assert.deepEqual(Changelog.checkVersion(`${preamble}
## Unreleased

### Added
- Some new feature

### Improved
- Some enhancement

### Changed
- Some change

### Fixed
- Some bug
`, createVersion(1, 1, 0)), E.right(true));
    });

    it('should pass for a major release with "Added", "Improved" or "Removed"', () => {
      assert.deepEqual(Changelog.checkVersion(`${preamble}
## Unreleased

### Added
- Some new feature

### Improved
- Some enhancement

### Removed
- Some removed feature
`, createVersion(2, 0, 0)), E.right(true));
    });

    it('should fail if "Added" used in a patch', () => {
      assert.deepEqual(
        Changelog.checkVersion(`${preamble}
## Unreleased

### Added
- Some new feature
`, createVersion(0, 1, 1)),
        E.left('Changelog contains an Added or Improved section for a patch release. This should be at least a minor.')
      );
    });

    it('should fail if "Improved" used in a patch', () => {
      assert.deepEqual(
        Changelog.checkVersion(`${preamble}
## Unreleased

### Improved
- Some enhancement
`, createVersion(0, 1, 1)),
        E.left('Changelog contains an Added or Improved section for a patch release. This should be at least a minor.')
      );
    });

    it('should fail if "Removed" used in a patch or minor', () => {
      assert.deepEqual(
        Changelog.checkVersion(`${preamble}
## Unreleased

### Removed
- Some removed feature
`, createVersion(0, 1, 1)),
        E.left('Changelog contains a Removed section for a patch release. This should be at least a major.')
      );

      assert.deepEqual(
        Changelog.checkVersion(`${preamble}
## Unreleased

### Removed
- Some removed feature
`, createVersion(0, 1, 0)),
        E.left('Changelog contains a Removed section for a minor release. This should be at least a major.')
      );
    });
  });
});