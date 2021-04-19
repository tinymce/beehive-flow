import * as BeehiveArgs from '../args/BeehiveArgs';

type BeehiveArgs = BeehiveArgs.BeehiveArgs;

export const printHeaderMessage = (args: BeehiveArgs): void => {
  const cmd = BeehiveArgs.commandName(args);
  const dryRunMessage = args.dryRun ? ' (dry-run)' : '';
  console.log(`Running: ${cmd} ${dryRunMessage}`);
};
