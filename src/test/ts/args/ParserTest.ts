import { describe, it } from 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import fc from 'fast-check';
import * as O from 'fp-ts/Option';
import { parseArgs } from '../../../main/ts/args/Parser';
import * as BeehiveArgs from '../../../main/ts/args/BeehiveArgs';

const assert = chai.use(chaiAsPromised).assert;

describe('Parser', () => {
  describe('parseArgs', () => {
    it('fails with no args', async () => {
      await assert.isRejected(parseArgs([]));
    });
    it('succeeds for prepare command', async () => {
      await assert.becomes(parseArgs([ 'prepare' ]), BeehiveArgs.prepareArgs(false, process.cwd(), O.none, O.none));
      await assert.becomes(parseArgs([ 'prepare', '--dry-run' ]), BeehiveArgs.prepareArgs(true, process.cwd(), O.none, O.none));
    });
    it('succeeds for release command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}` ]),
          BeehiveArgs.releaseArgs(false, process.cwd(), O.none, O.none, { major, minor })
        );
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}`, '--dry-run' ]),
          BeehiveArgs.releaseArgs(true, process.cwd(), O.none, O.none, { major, minor })
        );
      }));
    });
    it('succeeds for advance command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}` ]),
          BeehiveArgs.advanceArgs(false, process.cwd(), O.none, O.none, { major, minor })
        );
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}`, '--dry-run' ]),
          BeehiveArgs.advanceArgs(true, process.cwd(), O.none, O.none, { major, minor })
        );
      }));
    });
    it('succeeds for advance command', async () => {
      await assert.becomes(parseArgs([ 'stamp' ]), BeehiveArgs.stampArgs(false, process.cwd()));
      await assert.becomes(parseArgs([ 'stamp', '--dry-run' ]), BeehiveArgs.stampArgs(true, process.cwd()));
    });
  });
});
