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
      await assert.becomes(
        parseArgs([ 'prepare' ]),
        O.some(BeehiveArgs.prepareArgs(false, O.none, O.none))
      );
      await assert.becomes(
        parseArgs([ 'prepare', '--dry-run' ]),
        O.some(BeehiveArgs.prepareArgs(true, O.none, O.none))
      );
    });
    it('succeeds for release command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}` ]),
          O.some(BeehiveArgs.releaseArgs(false, O.none, O.none, { major, minor }))
        );
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}`, '--dry-run' ]),
          O.some(BeehiveArgs.releaseArgs(true, O.none, O.none, { major, minor }))
        );
      }));
    });
    it('succeeds for advance command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}` ]),
          O.some(BeehiveArgs.advanceArgs(false, O.none, O.none, { major, minor }))
        );
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}`, '--dry-run' ]),
          O.some(BeehiveArgs.advanceArgs(true, O.none, O.none, { major, minor }))
        );
      }));
    });
    it('succeeds for advance command', async () => {
      await assert.becomes(
        parseArgs([ 'stamp' ]),
        O.some(BeehiveArgs.stampArgs(false))
      );
      await assert.becomes(
        parseArgs([ 'stamp', '--dry-run' ]),
        O.some(BeehiveArgs.stampArgs(true))
      );
    });
  });
});
