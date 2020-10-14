import { ReleaseArgs } from '../args/BeehiveArgs';
import * as Version from '../data/Version';

export const release = async (fc: ReleaseArgs): Promise<void> => {
  const sMajorMinor = Version.majorMinorVersionToString(fc.majorMinorVersion);

  const dryRunMessage = fc.dryRun ? ' (dry-run)' : '';
  console.log(`Release${dryRunMessage} ${sMajorMinor}`);

}