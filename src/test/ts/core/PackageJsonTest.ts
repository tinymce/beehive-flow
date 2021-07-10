import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as E from 'fp-ts/Either';

import * as PackageJson from '../../../main/ts/core/PackageJson';

describe('PackageJson', () => {
  describe('decodeE', () => {
    it('decodes package with name', () => {
      const actual = PackageJson.decodeE({
        name: 'blah'
      });
      assert.deepEqual(actual, E.right({
        name: 'blah'
      }));
    });

    it('decodes package with name and version', () => {
      const actual = PackageJson.decodeE({
        name: 'blah',
        version: '1.2.3-rc'
      });
      assert.deepEqual(actual, E.right({
        name: 'blah',
        version: { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined }
      }));
    });

    it('decodes package with name, version and workspaces', () => {
      const actual = PackageJson.decodeE({
        name: 'blah',
        version: '1.2.3-rc',
        workspaces: [ 'cat', 'dog*' ]
      });
      assert.deepEqual(actual, E.right({
        name: 'blah',
        version: { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined },
        workspaces: [ 'cat', 'dog*' ]
      }));
    });

    it('allows extraneous properties', () => {
      const actual = PackageJson.decodeE({
        name: 'blah',
        version: '1.2.3-rc',
        workspaces: [ 'cat', 'dog*' ],
        fridge: 'donkey'
      });
      assert.deepEqual(actual, E.right({
        name: 'blah',
        version: { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined },
        workspaces: [ 'cat', 'dog*' ],
        fridge: 'donkey'
      }));
    });

    it('decodes beehive-flow custom properties', () => {
      const actual = PackageJson.decodeE({
        name: 'blah',
        version: '1.2.3-rc',
        beehiveFlow: {
          primaryWorkspace: 'blah'
        }
      });
      assert.deepEqual(actual, E.right({
        name: 'blah',
        version: { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined },
        beehiveFlow: {
          primaryWorkspace: 'blah'
        }
      }));
    });

    it('decodes dependencies', () => {
      const actual = PackageJson.decodeE({
        name: 'blah',
        version: '1.2.3-rc',
        devDependencies: {
          '@tinymce/beehive-flow': 'latest'
        },
        dependencies: {
          dep1: '>=5.0.0'
        }
      });
      assert.deepEqual(actual, E.right({
        name: 'blah',
        version: { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined },
        devDependencies: {
          '@tinymce/beehive-flow': 'latest'
        },
        dependencies: {
          dep1: '>=5.0.0'
        }
      }));
    });
  });

  describe('round-trip', () => {
    it('round-trips extraneous properties', async () => {
      const input = {
        name: 'blah',
        version: '1.2.3-rc',
        workspaces: [ 'cat', 'dog*' ],
        fridge: 'donkey'
      };
      const parsed = await PackageJson.decode(input);
      const output = PackageJson.toJson(parsed);
      assert.deepEqual(output, input);
    });
  });

  describe('check pre-release dependencies', () => {
    it('should fail when a dependency is a pre-release version', async () => {
      const pj = {
        name: 'blah',
        dependencies: {
          dep1: '^5.0.0-rc',
          dep2: '^5.0.0-feature.20210525.sha123456',
          dep3: '^5.0.0-alpha.20210525.shaabcdef',
          dep4: '^5.0.0-spike.20210525.sha456def',
          dep5: '^5.0.0-hotfix.20210525.sha123abc',
          beehive: '^0.16.0'
        }
      };
      const result = PackageJson.shouldNotHavePreReleasePackages(pj);
      await assert.isRejected(result, 'Pre-release versions were found for: dep1, dep2, dep3, dep4, dep5');
    });

    it('should fail when the beehive dev dependency is a pre-release version', async () => {
      const pj = {
        name: 'blah',
        devDependencies: {
          '@tinymce/beehive-flow': '^0.16.0-rc'
        }
      };
      const result = PackageJson.shouldNotHavePreReleasePackages(pj);
      await assert.isRejected(result, 'Pre-release versions were found for: @tinymce/beehive-flow');
    });

    it('should ignore RC dev dependencies', async () => {
      const pj = {
        name: 'blah',
        devDependencies: {
          dep1: '^5.0.0-rc',
          dep2: '^5.0.0-feature.20210525.sha123456',
          dep3: '^5.0.0-alpha.20210525.shaabcdef',
          dep4: '^5.0.0-hotfix.20210525.sha123abc'
        }
      };
      const result = PackageJson.shouldNotHavePreReleasePackages(pj);
      await assert.isFulfilled(result);
    });
  });
});
