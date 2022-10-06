import * as cp from 'child_process';
import * as path from 'path';
import getPort from 'get-port';
import * as O from 'fp-ts/Option';
import { SimpleGit } from 'simple-git';
import * as Dispatch from '../../../main/ts/args/Dispatch';
import * as Parser from '../../../main/ts/args/Parser';
import * as NpmTags from '../../../main/ts/core/NpmTags';
import * as PackageJson from '../../../main/ts/core/PackageJson';
import { versionToString } from '../../../main/ts/core/Version';
import * as Changelog from '../../../main/ts/keepachangelog/Changelog';
import * as Files from '../../../main/ts/utils/Files';
import * as Git from '../../../main/ts/utils/Git';
import * as ObjUtils from '../../../main/ts/utils/ObjUtils';

const writePackageJson = async (
  dir: string, packageName: string, version: string, dependencies: Record<string, string> = {}, address: string = 'blah://frog'
) => {
  const pjFile = path.join(dir, 'package.json');
  const pjContents = `
      {
        "name": "@beehive-test/${packageName}",
        "version": "${version}",
        "publishConfig": {
          "@beehive-test:registry": "${address}"
        },
        "dependencies": ${JSON.stringify(dependencies)}
      }`;
  await Files.writeFile(pjFile, pjContents);
  return pjFile;
};

export const writeChangelog = async (dir: string, version?: string) => {
  const changelogFile = path.join(dir, 'CHANGELOG.md');
  const heading = version === undefined ? '## Unreleased' : `## ${version} - 2001-10-05`;
  await Files.writeFile(changelogFile, `# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${heading}

### Fixed
- Fixed some bug. #GH-1234

## 0.1.0 - 2000-02-02

### Added
- Example added entry.

### Improved
- Some improved example.
  - Nested entry test.

### Security
- Fixed vulnerability.

## 0.0.1 - 2000-01-01

### Added
- Initial release.
`);
  return changelogFile;
};

export const writeAndAddLocalFile = async (git: SimpleGit, dir: string, fileName: string, contents: string = 'placeholder') => {
  const filePath = path.join(dir, fileName);
  await Files.writeFile(filePath, contents);
  await git.add([ filePath ]);
  return filePath;
};

export const writeNpmrc = async (address: string, dir: string): Promise<string> => {
  // NOTE: NPM 5.3.0 or higher needs an auth token to be able to publish
  // See https://github.com/verdaccio/verdaccio/issues/212#issuecomment-308578500
  const noProtocolAddress = address.replace(/^https?:\/\//, '//');
  const npmrc = `${noProtocolAddress}/:_authToken=anonymous\n@beehive-test:registry=${address}`;
  const npmrcFile = path.join(dir, '.npmrc');
  await Files.writeFile(npmrcFile, npmrc);
  return npmrcFile;
};

export const makeBranchWithPj = async (
  git: SimpleGit,
  branchName: string,
  dir: string,
  packageName: string,
  version: string,
  newVersion?: string,
  dependencies: Record<string, string> = {},
  address: string = 'blah://frog'
) => {
  await Git.checkoutNewBranch(git, branchName);
  const npmrcFile = await writeNpmrc(address, dir);
  const pjFile = await writePackageJson(dir, packageName, version, dependencies, address);
  const changelogFile = await writeChangelog(dir, newVersion);
  await git.add([ npmrcFile, pjFile, changelogFile ]);
  await git.commit('commit');
  await Git.push(git);
  return pjFile;
};

export const beehiveFlow = async (args: string[]): Promise<void> => {
  const a = await Parser.parseArgs(args);
  if (O.isSome(a)) {
    await Dispatch.dispatch(a.value);
  } else {
    throw new Error('Args parse failure');
  }
};

export const getNpmTags = async (cwd: string, packageName: string): Promise<Record<string, string>> => {
  const tags = await NpmTags.getNpmTags(cwd, `@beehive-test/${packageName}`);
  return ObjUtils.map(tags, versionToString);
};

export const readPjVersion = async (pjFile: string): Promise<string> => {
  const pj = await PackageJson.parsePackageJsonFile(pjFile);
  const v = pj.version;
  if (v === undefined) {
    throw new Error('Version was undefined');
  }
  return versionToString(v);
};

export const readKeepAChangelog = async (changelogFile: string): Promise<Changelog.Changelog> => {
  const content = await Files.readFileAsString(changelogFile);
  return Changelog.parse(content);
};

export const readPjVersionInDir = async (dir: string): Promise<string> =>
  readPjVersion(path.join(dir, 'package.json'));

export const readKeepAChangelogInDir = async (dir: string): Promise<Changelog.Changelog> =>
  readKeepAChangelog(path.join(dir, 'CHANGELOG.md'));

export const makeReleaseTags = async (git: SimpleGit, dir: string, packageName: string, tags: string[]): Promise<void> => {
  await Git.checkoutMainBranch(git);
  const tempBranchName = 'temp';
  await Git.checkoutNewBranch(git, tempBranchName);
  for (const tag of tags) {
    const pjFile = await writePackageJson(dir, packageName, tag);
    await git.add([ pjFile ]);
    await git.commit(`Release ${tag}`);
    await git.addTag(tag);
  }
  await Git.checkoutMainBranch(git);
  await git.deleteLocalBranch(tempBranchName, true);
  await git.push([ '--tags' ]);
};

export const startVerdaccio = async () => {
  const configDir = await Files.tempFolder();
  const config = `
storage: ${configDir}/storage
packages:
  '@beehive-test/*':
    access: $anonymous
    publish: $anonymous
    proxy: npmjs
web:
  enable: false
`;
  const configFile = path.join(configDir, 'config.yml');
  await Files.writeFile(configFile, config);

  const port = await getPort();
  const hostAndPort = `127.0.0.1:${port}`;
  const verdaccio = cp.spawn('yarn', [ 'verdaccio', '--listen', hostAndPort, '--config', configFile ], { stdio: 'inherit' });

  const address = `http://${hostAndPort}`;
  return { port, verdaccio, address };
};
