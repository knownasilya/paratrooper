'use strict';

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var inquirer = require('inquirer');
var mkdirp = require('mkdirp');
var config = require('./config');

exports.init = function (target, options, defaults, plugin) {
  target = target || defaults.defaultTarget || 'production';

  normalizeTarget(target, options.directory, function (err, targetPath) {
    if (err) {
      throw new Error(err);
    }

    config.generate({
      pkg: findPackageJson(options.rootPath),
      targetPath: targetPath,
      rootPath: options.rootPath,
      pluginPrompts: plugin.prompts ? plugin.prompts.init : undefined
    }, function (answers) {
      plugin.init(targetPath, answers);
    });
  });
};

exports.deploy = function (target, options, defaults, plugin) {
  target = target || defaults.defaultTarget;

  promptForTarget(target, options.directory, function (err, targetPath) {
    if (err) {
      throw new Error(err);
    }

    config.load(targetPath, function (settings) {
      settings.directory = targetPath;
      settings.debug = options.debug;

      plugin.deploy(settings, options);
    });
  });
};

exports.remove = function (target, options, defaults, plugin) {
  target = target || defaults.defaultTarget;

  promptForTarget(target, options.directory, function (err, targetPath) {
    if (err) {
      throw new Error(err);
    }

    config.load(targetPath, function (settings) {
      plugin.remove(settings, options);
    });
  });
};

exports.catchAll = function catchAll() {
  console.log('please use one of the following commands: '
    + 'init, deploy, remove - see the help, `pt --help` for more details');
};

function targetPrompt(files, cb) {
  if (files && files.length === 1) {
    cb(files[0]);
  }

  inquirer.prompt([
    {
      type: 'list',
      name: 'target',
      message: 'Which target would you like to deploy?',
      choices: files
    }
  ], function (answers) {
    cb(answers.target);
  });
}

function normalizeTarget(target, directory, cb) {
  directory = directory || 'deploy';

  var targetPath = path.join(directory, target);

  if (!fs.existsSync(targetPath)) {
    mkdirp.sync(targetPath);
  }

  fs.stat(targetPath, function (err, stats) {
    if (stats && stats.isDirectory()) {
      cb(null, targetPath);
    }
    else {
      cb(err || true, null);
    }
  });
}

function promptForTarget(target, directory, cb) {
  if (!target) {
    var directories = fs.readdirSync(directory).filter(function (item) {
      return fs.statSync(path.join(directory, item)).isDirectory();
    });

    if (directories && directories.length === 1) {
      cb(null, path.join(directory, directories[0]));
    }
    else {
      targetPrompt(directories, function (target) {
        cb(null, path.join(directory, target));
      });
    }
  }
  else {
    normalizeTarget(target, directory, cb);
  }
}

function findPackageJson(root) {
  var projectPackage = path.join(process.cwd(), root, 'package');
  var pkg;

  try {
    pkg = require(projectPackage);
  }
  catch (error) {
    throw new Error(chalk.red('Could not find `package.json` in this directory (' + path.dirname(projectPackage) + '). ' +
      'Paratrooper should be run from the project root, where `package.json` is located.'));
  }

  return pkg;
}

function processUserConfig(target, options, cb) {
  console.log('processing user config..');

  fs.readFile('.paratrooperrc', { encoding: 'utf8' }, function (err, contents) {
    if (err) {
      cb(err, undefined);
    }

    var config = JSON.parse(contents);

    cb && cb(undefined, { target: target || config.defaultTarget, options: options });
  });
}
