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
 (x.y.0-alpha)         |           \
  +--------------------+------------+-----
```

The `main` branch is branched to `release/x.y` branches to stabilise a minor version. This is done with `beehive-flow prepare`:

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

The `main` and `release/x.y` branches can either be in a "release candidate" state with a version like `x.y.z-rc`, or
a "release ready" state with a version like `x.y.z-rc`. This affects what version is published from CI.

`beehive-flow release` changes a branch from an rc version to a release version e.g. `1.2.3-rc` -> `1.2.3`. 
When CI encounters this, a release version is published. 

```
                [release]:
+-------------------------+---------------
release/1.2     
(1.2.0-rc)                (1.2.0)

```

CI then runs `beehive-flow advance-ci`, which changes the branch to the next rc version e.g. `1.2.3` -> `1.2.4-rc`.

```
                [release]:           [advance-ci]: 
+-------------------------+------------------------+------------
release/1.2     
(1.2.0-rc)                (1.2.0)                  (1.2.1-rc)

```

At the start of any CI build, `beehive-flow stamp` is run, which adds a timestamp to the version (except if it's a release version).
This enables us to publish release or prerelease packages for every build.

## Process Variations

There are two main process variations, tailored to two different requirements.

1. Basic process (release from `main`)

In this process a team works continuously on a minor version and its patches in the `main` branch. 
Whenever `main` is ready for release, the team runs `beehive-flow release main`. 

When the team is ready to work on the next minor release, they run `beehive-flow prepare`. 
This creates the `release/x.y` branch that the team uses to backport fixes to old releases.

Key aspects: 
- releasing from main
- stabilising *after* release

This process is suitable for the following scenarios:
- projects that mostly get bug fixes
- projects that are more continuously delivered
- no strict stabilisation or QA phase

2. Advanced process (release from `release/x.y` branches)

In this process, a team is focused on developing the next minor release. 
When they are ready to stabilise this version for testing, they run `beehive-flow prepare`. 
The testers can then test the new version, while other developers begin work on the next minor version.

Key aspects:
- releasing only from `release/x.y`
- stabilising *before* release 

This process is suitable for the following scenarios:
- projects focused on new feature releases
- projects that have a strict stabilisation or QA phase

### Feature vs Spike branches

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

### prepare

This signifies that `main` is ready for stabilization.
`main` is branched as `release/a.b`, where `a.b` come from package.json

Version changes

 - `main`: `a.b.x-rc` -> `a.c.0-rc`
 - `release/a.b`: `a.b.x-rc`

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
 2. Changes the version to a "timestamped" version, so that each build can be published.
 
The timestamping changes the package.json file. The idea is to build and publish, but not to commit the changes.

Versions are changed thus:

 - On the main branch, `a.b.0-alpha` becomes `a.b.0-alpha.TIMESTAMP.GITSHA`
 - On a feature branch, `a.b.0-*` becomes `a.b.0-feature.TIMESTAMP.GITSHA`
 - On a hotfix branch, `a.b.c-*` becomes `a.b.c-hotfix.TIMESTAMP.GITSHA`
 - On a spike branch, `a.b.c-*` becomes `a.b.c-spike.TIMESTAMP.GITSHA`
 - On a release branch in prerelease state, `a.b.c-rc` becomes `a.b.c-rc.TIMESTAMP.GITSHA`
 - On a release branch in release state, no changes are made.
 
Timestamp format is `yyyyMMddHHmmssSSS` in UTC. The short git sha format is used.

Note: this is the only command that operates on the checkout in the current working directory.

### publish

This command does an `npm publish` and sets npm tags based on the repository state.

 - main/feature/hotfix/spike branches are tagged with their branch name
 - release branches in prerelease state are tagged `rc-a.b`
 - release branches in release state are tagged `release-a.b`. 
 - release branches in release state are also tagged `latest` if this is the release with the highest version number.

Note: it appears that npm also tags the very first published build of each repo with "latest". 

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
  "isLatestReleaseBranch": false
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
 - isLatestReleaseBranch - Is this a release branch, and is it the _latest_ release branch? If `true`, this is the state where beehive-flow would npm tag the build as `latest`.

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

### How do I update my major version?

Set the version manually in package.json in your `main` branch. 
The idea is that you should decide what major.minor version you are releasing before running `prepare`.

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
