# beehive-flow

Beehive Flow is a git branching process and a supporting CLI tool. It is designed for packaged software and libraries, 
particularly those with many past versions requiring active support. Beehive Flow is prescriptive about what the project's
version numbers are and how they change through the branching process. CI is explicitly considered in the process, 
with a set of commands to be run at different stages of the build. 

Beehive Flow is designed to support publishing prerelease versions of each build of each branch. It does this by timestamping
version numbers at the start of a build. 

Beehive Flow is similar to [GitLab flow with release versions](https://docs.gitlab.com/ee/topics/gitlab_flow.html#release-branches-with-gitlab-flow),
and is compatible with Semantic Versioning. It also takes inspiration from [git-flow](https://nvie.com/posts/a-successful-git-branching-model/). 

This readme is the canonical definition of the branching process. This git repo implements the branch process for NPM projects. 
Support for monorepos using yarn workspaces is planned.

## Process Overview

beehive-flow uses the following branch names, each forming part of the process:

 - main
 - release/x.y
 - feature/FEATURE_CODE
 - hotfix/FEATURE_CODE
 - spike/FEATURE_CODE

Branch names and versions are strict and enforced.

All new work happens in `feature/*` branches which are merged to the `main` branch:

```
                       feature/BLAH-123
  main                 +-----------
 (x.y.0-rc)            |           \
  +--------------------+------------+-----
```

The `main` branch can be branched to `release/x.y` branches to maintain older minor versions. These branches are created from old releases with `behive-flow revive`:

```
  main
 (1.2.3)                    (2.1.5-rc)
  +- - - - - - - - - - - - - +--------------
  |
  ↓             [revive 1.2]:
  - - - - - - - - - - - - - - +-------------
                              release/1.2
                             (1.2.4-rc)
```

For advanced use-cases, a `release/x.y` branch can be created before `x.y.0` is released, using `beehive-flow prepare`:

```
  main                 
 (1.2.0-rc)           (1.3.0-rc)
  +-----------------+--------------------                             
         [prepare]: |                             
                    +--------------------
                    release/1.2                  
                    (1.2.0-rc)        
```

To make changes to a `release/x.y` branch, create a `hotfix/*` branch, cherry-pick from `main`, then merge:

```
  main
 (1.2.0-rc)
  +---------+---------------------------------
            |              | |  cherry-pick and tweak
            |              ↓ ↓
            |            +---------+  hotfix/BLAH-123
            |            |          \
            +------------+-----------+--------
            release/1.3
            (1.2.0-rc)
```

Beehive Flow is designed so that every commit can be published. To avoid conflicts with stable releases, the version in
the `package.json` will almost always be a "release candidate" version like `x.y.z-rc`. A stable release takes place in
two stages: `beehive-flow release` and `beehive-flow advance-ci`. The two-stage process is shown below:

```
 main
(1.2.4-rc)           (1.2.4)              (1.2.5-rc)
-+--------------------+--------------------+------------
            [release]:        [advance-ci]:
```

To perform a release, run either `beehive-flow release main` or `beehive-flow release x.y`, depending on whether you
want to release from the `main` branch or a `release/x.y` branch. This will "stabilise" the version number on that
branch, removing the `-rc`. From there, CI will publish your release and then run `beehive-flow advance-ci` to update
that branch to the next release candidate version.

To avoid duplicate version numbers, `beehive-flow stamp` is run at the start of any CI build for a release candidate,
which adds some metadata to the version string, such as the timestamp of the build, and the git SHA of the commit.

## Preparing for release

To release a stable version (such as `a.b.x`) with Beehive Flow, you need to set the version of the branch you plan to
release from to `a.b.x-rc`. The branch you release from should either be `main`, or `release/a.b`, which one you choose
is based on the following questions:

1. Does the branch `release/a.b` exist?

If the branch `release/a.b` exists, then all releases of the form `a.b.*` should take place from that branch. The
version set in this branch will already be `a.b.x-rc`, so no manual editing of the version is necessary.

2. Have you upgraded the `main` branch version above `a.b.*`?

If no `release/a.b` branch exists, but the version on main is already greater than `a.b.*`, you will need to create a
`release/a.b` branch. Run `beehive-flow revive a.b` to create this branch, which will have its version automatically
set to `a.b.x-rc`. Prepare your release on this branch.

3. Do you need a stabilisation period before your release?

If no `release/a.b` branch exists, and the version on `main` is `a.b.x-rc`, you have two options for releasing. The
**simple** variant is to release directly from `main`, with the command `beehive-flow release main`. However, if you
need to do work to stabilise this release (and want to do work on your next minor release with the `main` branch in
parallel with this) then you'll need the **advanced** variant. In this case, run `beehive-flow prepare`, which will
bump the version of the `main` branch to the next minor (`a.c.0-rc`) and create a `release/a.b` branch with version
`a.b.x-rc`.

## Minor and Major Upgrades

With the exception of `prepare`, which is for advanced use-cases only, the Beehive Flow tool will not perform minor or
major version upgrades to any branch. You must manually upgrade the version in your package.json, which is allowed on
any branch except a `release/x.y` branch. Be sure to keep the `-rc` at the end of your version number: changing
`1.2.3-rc` to `1.3.0-rc` or `2.0.0-rc` is fine, but changing `1.2.3-rc` to `1.3.0` is not.

While Beehive Flow does not specify how to do these upgrades, we recommend upgrading the version number in the
`feature/*` branch that introduces the first change that would require the upgrade. For example:

```
              feature/*
             (1.2.3-rc)     (1.3.0-rc)
 main         +--------------+--------+
(1.2.3-rc)    |                        \
 +------------+-------------------------+----------
                                       (1.3.0-rc)
```

## Feature vs Spike branches

Feature branches are branched off `main` and are named `feature/*`. Most new work is done here. It doesn't matter if it's a feature, improvement, task, 
refactor, bugfix or any other type of change... except for spikes.

Spike branches are branched off `main` and are named `spike/*`. These are treated similarly to feature branches, but are just intended to indicate that
the work is experimental and not to be merged.

## About rc and prerelease versions

The only allowed prerelease version is "rc". 

`main` and `release/x.y` alternate between rc and release versions. Any other prerelease version will error.

Other branches should always have "rc" versions, though this is not enforced.

When stamping, different prerelease versions are chosen based on the branch type (see below).

## Commands

Note: the `stamp`, `advance-ci` and `publish` commands operate on a checkout in the current working directory,
whereas the other commands make a fresh clone in a temp directory.

For a detailed description about command-line usage and arguments, run `yarn beehive-flow --help` or `yarn beehive-flow --help COMMAND`.

### release main

This signifies that branch `main` is ready for release. 

Version changes:

 - `main`: `a.b.c-rc` -> `a.b.c`

### release a.b

This signifies that branch `release/a.b` is ready for release. 

Version changes:

 - `release/a.b`: `a.b.c-rc` -> `a.b.c`

### advance a.b

This signifies that branch `release/a.b` has been released and is ready to accept changes for the next patch release. 
This command is intended to be run manually. Usually, `advance-ci` should be used instead.

Version changes:

 - `release/a.b`: `a.b.c` -> `a.b.d-rc`

### advance-ci

This command is similar to `advance`, however:

 - it works in a current directory
 - if the current directory is not a release branch in release ready state, it exits successfully, whereas `advance` errors
 - it doesn't have the `git-url` or version parameters

### stamp

This command should be run at the start of a build. This command does the following:

 1. Checks that the package.json file has a valid version for the branch.
 2. Changes the version to a "timestamped" version, so that each build can be published (except for release versions).
 
The timestamping changes the package.json file. The idea is to build and publish, but not to commit the changes.

Versions are changed thus:

 - On a feature branch, `a.b.0-*` becomes `a.b.0-feature.TIMESTAMP.sha-GITSHA`
 - On a hotfix branch, `a.b.c-*` becomes `a.b.c-hotfix.TIMESTAMP.sha-GITSHA`
 - On a spike branch, `a.b.c-*` becomes `a.b.c-spike.TIMESTAMP.sha-GITSHA`
 - On a main or release branch in rc state, `a.b.c-rc` becomes `a.b.c-rc.TIMESTAMP.sha-GITSHA`
 - On a main or release branch in release state, no changes are made.
 
Timestamp format is `yyyyMMddHHmmssSSS` in UTC. The short git sha format is used.

Note: this command operates on the checkout in the current working directory.

### revive a.b

This command allows a `release/a.b` branch to be created from previous release tags. This is useful if a hotfix needs to be backported to an older version. This command does the following:

1. Finds all tags that match the specified `a.b` version.
2. Sorts the tags and determines the most recent patch release.
3. Creates the new `release/a.b` branch from the tag.
4. Advances the version to the next RC patch release.

Version changes:

- `release/a.b`: `a.b.c` -> `a.b.d-rc`

### prepare

This signifies that `main` is ready for stabilization.
`main` is branched as `release/a.b`, where `a.b` come from package.json

Version changes

- `main`: `a.b.x-rc` -> `a.c.0-rc`
- `release/a.b`: `a.b.x-rc`

### publish

This command does an `npm publish` and sets npm tags based on the repository state.

 - feature/hotfix/spike branches are tagged with their branch name
 - main and release branches in rc state are tagged `rc-a.b`
 - main and release branches in release state are tagged `release-a.b`. 
 - main and release branches in rc or release state are also tagged `latest` if this is the release with the highest version number.

`beehive-flow publish` also git tags any release builds as `packagename@version`. 

#### Determining the `latest` build

When publishing, `beehive-flow` reads the existing NPM tags from the repo and uses those to determine whether or not
to set `latest` on the new build. `latest` is set if the new build's number is "greater" than the existing build. 

Note that all release builds are considered greater than all rc builds. So, for a new project, you may have a period
where your `latest` tag only points to `rc` builds, but after your first release, `latest` will always point to a release build.

Note that the first publish of a build is always tagged `latest`.

### status

This command prints out beehive-flow's interpretation the current status of the repo, in JSON format.
This is useful for integrating with other CI tools.

Run this as `yarn run --silent beehive-flow status` otherwise yarn's output will make stdout invalid JSON.

Example:

```
$ yarn --silent beehive-flow status
{
  "currentBranch": "feature/TINY-6867",
  "version": {
    "major": 0,
    "minor": 11,
    "patch": 0,
    "preRelease": "rc"
  },
  "versionString": "0.11.0-rc",
  "branchType": "feature",
  "branchState": "feature",
  "isLatest": false
}
```

Note: this command will fail if the repo is in an invalid state.

Fields:

 - currentBranch - the current git branch
 - version - parsed version in `package.json`. Has `major`, `minor` and `patch` fields and may have `preRelease` and `buildMetadata` fields if present.
 - versionString - raw version string
 - branchType - one of: `main`, `feature`, `hotfix`, `spike`, `release`
 - branchState - state of the branch - similar to branchType, but splits release branches into 2 separate states. 
   May be one of: `main`, `feature`, `hotfix`, `spike`, `releaseCandidate`, `releaseReady`
 - isLatest - If this version were to be published, would it be the `latest` build?

If you want to read this from a Jenkinsfile:

```
def shJson(String script) {
    def s = sh(script: script, returnStdout: true);
    return readJSON(text: s);
}

def beehiveFlowStatus = shJson("yarn run --silent beehive-flow status");
```

Then, if you want to run something when beehive-flow would publish a new release build of the latest release:

```
if (beehiveFlowStatus.branchState == 'releaseReady' && beehiveFlowStatus.isLatest) {

}
```

## CI Instructions

CI needs to check out a real branch, not just a detached head.

At the start of the build, run `stamp`. If the build is successful, run `advance-ci`.

## Adding beehive-flow to my project

These instructions assume Jenkins, yarn, TypeScript, mocha and eslint. 

 1. Best to disable CI during the changeover.
 2. Ensure you have a "main" branch - e.g. change your "master" branch to "main"
 3. `yarn add -D @tinymce/beehive-flow`
 4. Change your `Jenkinsfile` to something like below. Note there are issues running `beehive-flow publish` from `yarn` (see FAQ below).
    ```
    node("primary") {
      stage ("checkout") {
        checkout scm
      }
    
      stage("dependencies") {
        sh "yarn install"
      }
    
      stage("stamp") {
        sh "yarn beehive-flow stamp"
      }
    
      stage("build") {
        sh "yarn build"
      }
    
      stage("lint") {
        sh "yarn lint"
      }
    
      stage("test") {
        sh "yarn test"
      }
    
      stage("publish") {
        sshagent(credentials: ['my-git-credentials']) {
          sh "yarn beehive-flow publish"        
          sh "yarn beehive-flow advance-ci"
        }
      }
    }
    ```
 5. Note the yarn commands. Set up scripts in `package.json` to this effect. e.g.
    ```
    "build": "tsc",
    "lint": "eslint src/**/*.ts",
    "test": "yarn mocha"
    ```

## FAQ

### Does beehive-flow work with yarn workspaces, lerna or monorepos?

Not yet, but this is planned.

### Does beehive-flow work with any types of package other than NPM?

Not at this stage.

### Are there issues running `beehive-flow publish` from yarn?

`beehive-flow publish` uses `npm publish` to publish. When running this via yarn, yarn sets the environment variable
`npm_config_registry` to `https://registry.yarnpkg.com`. Depending on your CI config, this may cause you to get errors like this:

```
npm ERR! 404 Not Found - PUT https://registry.yarnpkg.com/@tinymce%2fbeehive-flow - Not found
``` 

To work around this, there are several options:
1. Run `yarn config set registry https://registry.npmjs.org/ -g` on your CI nodes (sets the registry in `~/.yarnrc`)
2. Run `yarn config set registry https://registry.npmjs.org/` in each project (sets the registry in the project's `.yarnrc`)
3. Set the publishConfig in your package.json file.
4. Instead of running from yarn, run `npx --no-install beehive-flow publish`. The `--no-install` forces npx to use your project's
   pinned beehive-flow and if it's not there, it fails instead of downloading the latest beehive-flow.

At Tiny, we're using option 1.
