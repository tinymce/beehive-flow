import { SimpleGit } from 'simple-git';
import * as PackageJson from './PackageJson';
import * as PreRelease from './PreRelease';
import { Version, versionToString } from './Version';

type PackageJson = PackageJson.PackageJson;

export const updateToNextPatch = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
  preRelease: PreRelease.releaseCandidate
});

export const updateToNextMinor = (version: Version): Version => ({
  major: version.major,
  minor: version.minor + 1,
  patch: 0,
  preRelease: PreRelease.releaseCandidate
});

export const updateToStable = (version: Version): Version => ({
  major: version.major,
  minor: version.minor,
  patch: version.patch
});

const advance = async (version: Version, pj: PackageJson, pjFile: string, advanceVersion: (version: Version) => Version) => {
  const newVersion = advanceVersion(version);
  console.log(`Updating version from ${versionToString(version)} to ${versionToString(newVersion)}`);
  await PackageJson.writePackageJsonFileWithNewVersion(pj, newVersion, pjFile);
};

export const advancePatch = async (version: Version, pj: PackageJson, pjFile: string, git: SimpleGit): Promise<void> => {
  await advance(version, pj, pjFile, updateToNextPatch);
  await git.add(pjFile);
  await git.commit('Update version for next patch release');
};

export const advanceMinor = async (version: Version, pj: PackageJson, pjFile: string, git: SimpleGit): Promise<void> => {
  await advance(version, pj, pjFile, updateToNextMinor);
  await git.add(pjFile);
  await git.commit(`Update version for next minor release`);
};