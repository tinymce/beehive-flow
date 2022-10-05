import { describe, it } from 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as YarnWorkspaces from '../../../main/ts/core/YarnWorkspaces';

const assert = chai.use(chaiAsPromised).assert;

describe('info', () => {
  it('reads a test scenario with 2 modules', async () => {
    await assert.becomes(
      YarnWorkspaces.info('src/test/data/yarnInfo1'),
      {
        foo: {
          location: 'foo',
          workspaceDependencies: [],
          mismatchedWorkspaceDependencies: []
        },
        bar: {
          location: 'bar',
          workspaceDependencies: [],
          mismatchedWorkspaceDependencies: []
        }
      }
    );
  });

  it('reads a test scenario with 2 dependent modules', async () => {
    await assert.becomes(
      YarnWorkspaces.info('src/test/data/yarnInfo2'),
      {
        foo: {
          location: 'foo',
          workspaceDependencies: [ 'bar' ],
          mismatchedWorkspaceDependencies: []
        },
        bar: {
          location: 'bar',
          workspaceDependencies: [],
          mismatchedWorkspaceDependencies: []
        }
      }
    );
  });
});
