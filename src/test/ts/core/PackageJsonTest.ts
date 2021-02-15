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

    it('decodes beehive-flow custom properies', () => {
      const actual = PackageJson.decodeE({
        'name': 'blah',
        'version': '1.2.3-rc',
        'beehive-flow': {
          'primary-workspace': 'blah'
        }
      });
      assert.deepEqual(actual, E.right({
        'name': 'blah',
        'version': { major: 1, minor: 2, patch: 3, preRelease: 'rc', buildMetaData: undefined },
        'beehive-flow': {
          'primary-workspace': 'blah'
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
});