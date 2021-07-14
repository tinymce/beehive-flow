# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.17.0 - 2021-07-14

### Changed
- `spike` branches now use `alpha` as the pre-release version prefix #TINY-7701

## 0.16.0 - 2021-07-02

### Added
- `beehive-flow revive a.b` command to recreate a release branch from tags. #TINY-7474
- Support `dependabot` branch prefixes. #TINY-7165

### Improved
- An error will be thrown when attempting to `release` from a repository with un-pushed local changes. #TINY-7407
- The `release` command will now fail if the package still contains pre-release dependencies. This can be disabled using the `--allow-pre-releases` option. #TINY-7502

### Fixed
- The `prepare` command would incorrectly reset the release branch patch version back to 0.

## 0.15.0 - 2021-04-20

### Changed
- The prerelease version created by the `stamp` command will now prefix the git hash with "sha". #TINY-7333

### Fixed
- Certain unexpected errors would incorrectly print `[Object object]` instead of the object data.
- Command header messages weren't being printed to the console.

## 0.14.0 - 2021-02-16

### Added
- Prep work for monorepo support. #TINY-6986, #TINY-6987

### Changed
- Now tags as `X.Y.Z` instead of `module@X.Y.Z`. The latter form will be used for non-primary modules of monorepos. #TINY-7026

## 0.13.0 - 2021-02-02

### Changed
- Publishing beehive-flow from main branch. #TINY-6890

## 0.12.0 - 2021-01-27

### Changed
- Publish from main branch
- Tag greatest prerelease version as latest if no prior release versions
- Change output of status command

## 0.11.0 - 2021-01-11

### Added
- `beehive-flow publish --dist-dir` setting
- `beehive-flow status` command

## 0.10.0 - 2021-01-07

### Added
- Initial implementation.
