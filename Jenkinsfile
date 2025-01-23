#!groovy
@Library('waluigi@v6.0.1') _

standardProperties()

tinyPods.node(tag: '20') {
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
    // Beehive tests require global git username/email setup
    exec("git config --global user.name \"ephox\"")
    exec("git config --global user.email \"is-accounts@tiny.cloud\"")
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
