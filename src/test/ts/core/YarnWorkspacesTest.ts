import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as YarnWorkspaces from '../../../main/ts/core/YarnWorkspaces';

const assert = chai.use(chaiAsPromised).assert;

describe('info', () => {
  it('reads a test scenario with 2 modules', () => {
    void assert.becomes(
      YarnWorkspaces.info('src/test/data/yarninfo1'),
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
});
