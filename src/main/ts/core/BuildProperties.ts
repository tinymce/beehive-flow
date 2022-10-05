import * as path from 'path';
import PropertiesReader from 'properties-reader';
import * as Files from '../utils/Files';

export const writeBuildPropertiesFile = async (dir: string, releaseBranchName: string): Promise<string> => {
  const buildPropertiesFile = path.resolve(dir, 'build.properties');
  if (!await Files.exists(buildPropertiesFile)) {
    console.log(`${buildPropertiesFile} does not exist: creating`);
    await Files.writeFile(buildPropertiesFile, '');
  }

  console.log(`Updating properties file: ${buildPropertiesFile}`);
  const props = PropertiesReader(buildPropertiesFile);
  props.set('primaryBranch', releaseBranchName);
  await props.save(buildPropertiesFile);
  return buildPropertiesFile;
};