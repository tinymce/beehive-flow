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

A single mainline branch called "main" is used. All new features and fixes are merged first to the main branch, then cherry-picked to other branches as necessary.

```
  main
 (x.y.0-alpha)
  +---------+----------------------------------+------------------+
            |                                  |
            |                                  |
            |                                  |
            +-----------------+                +------------------+

             release/1.2                         release/1.3
             (1.2.x-rc / 1.2.x)                  (1.3.x-rc / 1.3.x)
```

Release branches are named "release/x.y" where x.y is the major.minor version. These are branched off the main branch at the beginning of *release preparation*.
The release branch code is stabilised and then released.

Support fixes are made first to the main branch (via a feature branch), then cherry-picked to a release/x.y branch (via a hotfix branch) and released.

The *only* acceptable branch names are as follows:
- main
- release/x.y
- feature/FEATURE_CODE
- hotfix/FEATURE_CODE

Feature branches are branched off main. All new work is done here. It doesn't matter if it's a feature, improvement, task, refactor, spike, bugfix or any other type of change. 
These are all considered feature branches. 

Hotfix branches are branched off a release branch. These are used to add changes during release preparation. Similar to feature branches, it doesn't matter what type of change
is being made, the key part is that these are branched from a release branch.

Unlike git-flow, there is no "develop" branch. There is also no "master" branch. The branch "main" was chosen instead, as this has become GitHub's default. 

Note that the stamp command validates that branch names meet the spec.

Versions
--------

Beehive Flow dictates how a project's internal version should be modeled. 

The main branch should have a version "a.b.0-main". As soon as a release branch is created, main's version should be incremented to "a.c.0-main".  

The release branches start with a version "a.b.0-rc". When stabilization is complete, the release branch version is changed to "a.b.0". 
This indicates to CI that this version can now be released. Once release is complete, the version is changed to "a.b.1-rc".

As you can see, a release branch exists in one of two states:
- "a.b.c-rc" - prerelease state
- "a.b.c" - releasable state

All patch releases for a major.minor release happen in the branch for the release/major.minor branch.

Feature branches have a version "a.b.0-main", just like the main branch. However, the stamp command will change "main" to "feature". See below.

Hotfix branches have a version "a.b.c-rc", just like a release branch. However, the stamp command will change "rc" to "hotfix". See below.

Operations
----------

Note: the "stamp" command operates on a checkout in the current working directory, whereas the other commands make their own checkout.

### prepare

This signifies that the mainline is ready for stabilization.
main is branched as release/a.b, where a.b come from package.json

Version changes
- main: a.b.0-main -> a.c.0-main
- release/a.b: a.b.0-rc

### release a.b

This signifies that branch release/a.b is ready for release. 

Version changes:
- release/a.b: a.b.c-rc -> a.b.c

### advance a.b

This signifies that branch release/a.b has been released and is ready to accept changes for the next patch release.

Version changes:
- release/a.b: a.b.c -> a.b.d-rc

### stamp

This command should be run at the start of a build. This command does the following:

 1. Checks that the package.json file has a valid version for the branch.
 2. Changes the version to a "timestamped" version, so that each build can be published.
 
The timestamping changes the package.json file. The idea is to build and publish, but not to commit the changes.

Versions are changed thus:

 - On the main branch, `a.b.0-alpha` becomes `a.b.0-alpha.TIMESTAMP+GITSHA`
 - On a feature branch, `a.b.0-alpha` becomes `a.b.0-feature.TIMESTAMP+GITSHA`
 - On a hotfix branch, `a.b.c-rc` becomes `a.b.c-hotfix.TIMESTAMP+GITSHA`
 - On a release branch in prerelease state, `a.b.c-rc` becomes `a.b.c-rc.TIMESTAMP+GITSHA`
 - On a release branch in release state, no changes are made.
 
Timestamp format is `yyyyMMddHHmmssSSS` in UTC. The short git sha format is used.

Note: this is the only command that operates on the checkout in the current working directory.

CI Instructions
---------------

CI needs to check out a real branch, not just a detached head.

At the start of the build, run "stamp". If the build is successful, run "advance".
