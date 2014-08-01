var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var readline = require('readline');
var chalk = require('chalk');
var inquirer = require('inquirer');
var defaults = require('./defaults');
var prompts = require('./prompts');
var configFileName = 'paratrooper.json';

exports.generate = function(options, cb) {
  options = options || {};
  pkg = options.pkg || {};

  var data = {
    appName: pkg.name
  };

  if (pkg.repository && pkg.repository.type === 'git') {
    data.cloneUrl = pkg.repository.url;
  }

  if (pkg.scripts) {
    data.scriptKeys = Object.keys(pkg.scripts);
  }

  inquirer.prompt(prompts(data), function (answers) {
    answers.appName = answers.appUrl || path.basename(process.cwd());
    answers.serverAppPath = '/var/www';
    answers.sitesEnabledPath = '/etc/nginx/sites-enabled';
    answers.rootPath = options.rootPath;

    if (!validate(answers)) {
      return;
    }

    save(options.targetPath, answers, function () {
      console.log(chalk.green('Created a \'' + path.basename(options.targetPath) + '\' deploy environment.'));
      cb(answers);
    });
  });
};

exports.load = function (targetPath, cb) {
  var configPath = getConfigPath(targetPath);

  fs.readFile(configPath, function (error, data) {
    if (error) {
      throw new Error(error);
    }

    var config = JSON.parse(data);

    if (!config) {
      console.log(chalk.red('\'' + targetPath + '\' config is invalid – please run `pt init [target]` to generate a valid configuration file.'));
      return process.exit(1);
    }
    
    cb(config);
  });
};

function validate(config) {
  var ok = true;

  function error(message) {
    console.log(chalk.red('Error: ' + message));
    ok = false;
  }

  if (!config.appUrl)           error('No app url was specified');
  if (!config.appName)          error('No app name was specified');
  if (!config.upstreamPort)     error('No upstream port was specified');
  if (!config.cloneUrl)         error('No git clone URL was specified');
  if (!config.sshAddress)       error('No server SSH address was specified');
  if (!config.branch)           error('No git branch specified');

  if (ok && !config.appUrl.match(/\./))         error('app url must be a valid url');
  if (ok && !config.sshAddress.match(/@/))      error('server SSH address does not specify user');
  if (ok && !parseInt(config.upstreamPort, 10)) error('upstream port must be a valid port number');

  return ok;
}

function save(basePath, config, cb) {
  var configPath = getConfigPath(basePath, true);

  mkdirp(path.dirname(configPath), function (error) {
    if (error) {
      throw error;
    }

    fs.writeFile(configPath, JSON.stringify(config, null, 2), function () {
      cb();
    });
  });
}

function getConfigPath(basePath, create) {
  var configPath = path.join(basePath, configFileName);
  var deprecatedConfigPath = path.join(basePath, 'config.json');

  if (!fs.existsSync(configPath) && !create) {
    if (fs.existsSync(deprecatedConfigPath)) {
      fs.renameSync(deprecatedConfigPath, configPath); 
    }

    if (!fs.existsSync(configPath)) {
      throw new Error(chalk.red('Configuration file (' + configPath + ') not found, please run `pt init [target]` from your project directory.'));
    }
  }

  return configPath;
}
