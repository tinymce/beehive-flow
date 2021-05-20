## [Unreleased]
### Improved
- An error will be thrown when attempting to `release` from a repository with un-pushed local changes. #TINY-7407

## [0.15.0] - 2021-04-20
### Changed
 - The prerelease version created by the `stamp` command will now prefix the git hash with "sha". #TINY-7333

### Fixed
 - Certain unexpected errors would incorrectly print `[Object object]` instead of the object data.
 - Command header messages weren't being printed to the console.

## [0.14.0] - 2021-02-16
### Added
 - Prep work for monorepo support. #TINY-6986, #TINY-6987

### Changed
 - Now tags as `X.Y.Z` instead of `module@X.Y.Z`. The latter form will be used for non-primary modules of monorepos. #TINY-7026

## [0.13.0] - 2021-02-02
### Changed
 - Publishing beehive-flow from main branch. #TINY-6890

## [0.12.0] - 2021-01-27
### Changed
 - Publish from main branch
 - Tag greatest prerelease version as latest if no prior release versions
 - Change output of status command

## [0.11.0] - 2021-01-11
### Added
 - `beehive-flow publish --dist-dir` setting
 - `beehive-flow status` command

## [0.10.0] - 2021-01-07
### Added
 - Initial implementation.
