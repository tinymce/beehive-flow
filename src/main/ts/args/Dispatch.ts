import * as Prepare from '../commands/Prepare';
import * as Release from '../commands/Release';
import * as Advance from '../commands/Advance';
import * as Stamp from '../commands/Stamp';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;

export const dispatch = (args: BeehiveArgs): Promise<void> =>
  BeehiveArgs.fold<Promise<void>>(
    args,
    Prepare.prepare,
    Release.release,
    Advance.advance,
    Stamp.stamp
  );
