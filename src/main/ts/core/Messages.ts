import * as BeehiveArgs from '../args/BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;

export const printHeaderMessage = (args: BeehiveArgs): string => {
  const cmd = BeehiveArgs.commandName(args);
  const dryRunMessage = args.dryRun ? ' (dry-run)' : '';
  return `Running: ${cmd} ${dryRunMessage}`;
};
