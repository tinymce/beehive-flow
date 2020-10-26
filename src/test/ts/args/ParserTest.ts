import { describe, it } from 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import fc from 'fast-check';
import * as O from 'fp-ts/Option';
import * as Parser from '../../../main/ts/args/Parser';
import * as BeehiveArgs from '../../../main/ts/args/BeehiveArgs';

const assert = chai.use(chaiAsPromised).assert;

describe('Parser', () => {
  describe('parseArgs', () => {
    it('fails with no args', async () => {
      await assert.isRejected(Parser.parseArgs([]));
    });
    it('succeeds for prepare command', async () => {
      await assert.becomes(Parser.parseArgs([ 'prepare' ]), BeehiveArgs.prepareArgs(false, O.none));
      await assert.becomes(Parser.parseArgs([ 'prepare', '--dry-run' ]), BeehiveArgs.prepareArgs(true, O.none));
    });
    it('succeeds for release command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(Parser.parseArgs([ 'release', `${major}.${minor}` ]), BeehiveArgs.releaseArgs(false, O.none, { major, minor }));
        await assert.becomes(Parser.parseArgs([ 'release', `${major}.${minor}`, '--dry-run' ]), BeehiveArgs.releaseArgs(true, O.none, { major, minor }));
      }));
    });
    it('succeeds for advance command', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(Parser.parseArgs([ 'advance', `${major}.${minor}` ]), BeehiveArgs.advanceArgs(false, O.none, { major, minor }));
        await assert.becomes(Parser.parseArgs([ 'advance', `${major}.${minor}`, '--dry-run' ]), BeehiveArgs.advanceArgs(true, O.none, { major, minor }));
      }));
    });
    it('succeeds for advance command', async () => {
      await assert.becomes(Parser.parseArgs([ 'stamp' ]), BeehiveArgs.stampArgs(false, O.none));
      await assert.becomes(Parser.parseArgs([ 'stamp', '--dry-run' ]), BeehiveArgs.stampArgs(true, O.none));
    });
  });
});
