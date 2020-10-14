# beehive-cli
experimental - see Dylan

This project is a CLI tool that implements the Beehive Flow branch process.


Beehive Flow Branch Process
===========================

Beehive Flow roughly models the "GitLab flow with release versions" [https://docs.gitlab.com/ee/topics/gitlab_flow.html#release-branches-with-gitlab-flow],
and is compatible with Semantic Versioning.

Beehive Flow augments the branch strategy with instructions on how to manage versions in key project files (e.g. package.json), and instructions for CI.  
In the below description, an NPM/Yarn package.json project is assumed, and the tooling is built for this. However, the branch concepts can be applied more broadly. 

Branches
--------

A single mainline branch called "master" or "main" is used. All new features and fixes are merged first to the main branch, then cherry-picked to other branches as necessary.

```
  main
  +---------+----------------------------------+------------------+
            |                                  |
            |                                  |
            |                                  |
            +-----------------+                +------------------+

             release/1.2                         release/1.3

```

Release branches are named "release/x.y" where x.y is the major.minor version. These are branched off the main branch at the beginning of *release stabilization*.
The release branch code is stabilised and then released.

Support fixes are made first to the main branch, then cherry-picked to a release/x.y branch and released.

Versions
--------

Beehive Flow dictates how a project's internal version should be modeled. 

The main branch should have a version "a.b.0-main". As soon as a release branch is created, main's version should be incremented to "a.c.0-main".  

The release branches start with a version "a.b.0-rc". When stabilization is complete, the release branch version is changed to "a.b.0". 
This indicates to CI that this version can now be released. Once release is complete, the version is changed to "a.b.1-rc".

As you can see, a release branch exists in one of two states:
- "a.b.c-rc" - prerelease state
- "a.b.c" - releasable state

All point releases for a major.minor release happen in the the branch for the release/major.minor branch.

Operations
----------

### freeze

This signifies that the mainline is ready for stabilization.
main is branched as release/a.b, where a.b come from package.json

Version changes
- main: a.b.0-main -> a.c.0-main
- release/a.b: a.b.0-rc

### release a.b

This signifies that branch release/a.b is ready for release. 

Version changes:
- release/a.b: a.b.c-rc -> a.b.c

### bump a.b

This signifies that branch release/a.b has been released and is ready to accept changes for the next patch release.

Version changes:
- release/a.b: a.b.c -> a.b.d-rc

CI Instructions
---------------

CI needs to check out a real branch, not just a detached head.

### build-start

This command should be run at the start of a build. This command does the following:

 1. Checks that the package.json file has a valid version for the branch.
 2. If the branch is a main branch, or a release branch in "prerelease" state, the version is changed to add the short git SHA as a suffix. 


### build-finish

This command should be run when the build completes. This command does the following:

 1. If the branch is a release branch in release state, runs the "bump" command to promote to new prerelease version.

TODO: Should beehive-cli push tags?

