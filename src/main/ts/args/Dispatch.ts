import * as Prepare from '../commands/Prepare';
import * as Release from '../commands/Release';
import * as Advance from '../commands/Advance';
import * as Stamp from '../commands/Stamp';
import * as BeehiveArgs from './BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;

const headerMessage = (args: BeehiveArgs): string => {
  const cmd = BeehiveArgs.commandName(args);
  const dryRunMessage = args.dryRun ? ' (dry-run)' : '';
  return `Running: ${cmd} ${dryRunMessage}`;
};

export const dispatch = (args: BeehiveArgs): Promise<void> => {
  console.log(headerMessage(args));

  return BeehiveArgs.fold<Promise<void>>(
    args,
    Prepare.prepare,
    Release.release,
    Advance.advance,
    Advance.advanceCi,
    Stamp.stamp
  );
};
