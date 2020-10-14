import { AdvanceArgs } from '../args/BeehiveArgs';
import * as Version from '../data/Version';

export const advance = async (fc: AdvanceArgs): Promise<void> => {
  const sMajorMinor = Version.majorMinorVersionToString(fc.majorMinorVersion);

  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Advance${dryRunMessage} ${sMajorMinor}`);

}