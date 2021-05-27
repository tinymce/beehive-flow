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
        O.some(BeehiveArgs.prepareArgs(false, process.cwd(), O.none, O.none))
      );
      await assert.becomes(
        parseArgs([ 'prepare', '--dry-run' ]),
        O.some(BeehiveArgs.prepareArgs(true, process.cwd(), O.none, O.none))
      );
    });

    it('succeeds for release command with major.minor arg', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}` ]),
          O.some(BeehiveArgs.releaseArgs(false, process.cwd(), O.none, O.none, `release/${major}.${minor}`, false))
        );
        await assert.becomes(
          parseArgs([ 'release', `${major}.${minor}`, '--dry-run' ]),
          O.some(BeehiveArgs.releaseArgs(true, process.cwd(), O.none, O.none, `release/${major}.${minor}`, false))
        );
      }));
    });

    it('succeeds for release command with main arg', async () => {
      await assert.becomes(
        parseArgs([ 'release', 'main' ]),
        O.some(BeehiveArgs.releaseArgs(false, process.cwd(), O.none, O.none, 'main', false))
      );
    });

    it('succeeds for advance command with major.minor arg', async () => {
      await fc.assert(fc.asyncProperty(fc.nat(100), fc.nat(100), async (major, minor) => {
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}` ]),
          O.some(BeehiveArgs.advanceArgs(false, process.cwd(), O.none, O.none, `release/${major}.${minor}`))
        );
        await assert.becomes(
          parseArgs([ 'advance', `${major}.${minor}`, '--dry-run' ]),
          O.some(BeehiveArgs.advanceArgs(true, process.cwd(), O.none, O.none, `release/${major}.${minor}`))
        );
      }));
    });

    it('succeeds for advance command with main arg', async () => {
      await assert.becomes(
        parseArgs([ 'advance', 'main' ]),
        O.some(BeehiveArgs.advanceArgs(false, process.cwd(), O.none, O.none, 'main'))
      );
    });

    it('succeeds for stamp command', async () => {
      await assert.becomes(
        parseArgs([ 'stamp' ]),
        O.some(BeehiveArgs.stampArgs(false, process.cwd()))
      );
    });

    it('succeeds for stamp command with dry-run', async () => {
      await assert.becomes(
        parseArgs([ 'stamp', '--dry-run' ]),
        O.some(BeehiveArgs.stampArgs(true, process.cwd()))
      );
    });
  });
});
