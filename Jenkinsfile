#!groovy
@Library('waluigi@v6.0.1') _

standardProperties()

tinyPods.node() {
  stage("deps") {
    yarnInstall()
  }

  stage("stamp") {
    exec("yarn beehive-flow stamp")
  }

  stage("build") {
    exec("yarn build")
  }

  stage("lint") {
    exec("yarn lint")
  }

  stage("test") {
    exec("yarn test")
  }

  stage("publish") {
    tinyGit.withGitHubSSHCredentials {
      tinyNpm.withNpmPublishCredentials {
        sh "yarn beehive-flow publish"
        sh "yarn beehive-flow advance-ci"
      }
    }
  }
}
