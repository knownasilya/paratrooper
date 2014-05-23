var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var inquirer = require('inquirer');
var config = require('./config');
var scripts = require('./scripts');
var deploy = require('./deploy');

exports.init = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);
  
  config.generate({
    pkg: findPackageJson(options.rootPath),
    targetPath: targetPath,
    rootPath: options.rootPath
  }, function (answers) {
    scripts.generate(targetPath, answers);
  });
};

exports.deploy = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);

  config.load(targetPath, function(settings) {
    settings.directory = targetPath;

    promptForPassword(settings.sshAddress, function (password) {
      settings.sshPassword = password;
      // TODO: generate deploy script
      deploy.run(settings, options.sshIdentityFile);
      // TODO: generate script, verify in callback
    });
  });
};

exports.remove = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);

  config.load(targetPath, function(settings) {
    promptForPassword(settings.sshAddress, function (password) {
      settings.sshPassword = password;
      // TODO: generate scripts
      deploy.remove(settings, options.sshIdentityFile);
    });
  });
};

exports.catchAll = function catchAll() {
  console.log('please use one of the following commands: '
    + 'init, deploy, remove - see the help, `pt --help` for more details');  
};

function promptForPassword(server, cb) {
  inquirer.prompt([
    {
      type: 'password',
      name: 'sshPassword',
      message: 'Please enter your password for ' + server + ' server:'
    }
  ], function (answers) {
    cb(answers.sshPassword);
  });
}

function normalizeTarget(target, directory) {
  target = target || 'production';
  directory = directory || 'deploy';

  return path.join(directory, target);
}

function findPackageJson(root) {
  var projectPackage = path.join(process.cwd(), root, 'package');
  var pkg;

  try {
    pkg = require(projectPackage);
  }
  catch (error) {
    throw new Error(chalk.red('Could not find `package.json` in this directory. Paratrooper should be run from the project root, where `package.json` is located.'));
  }

  return pkg;
}
