var fs = require('fs');
var readline = require('readline');
var chalk = require('chalk');
var defaults = require('./defaults');
var inquirer = require('inquirer');
var path = require('path');
var configFileName = 'config.json';

exports.generate = function(pkg, targetPath, cb) {
  var dirName = path.basename(process.cwd()),
    cloneUrl;

  if (pkg.repository && pkg.repository.type === 'git') {
    cloneUrl = pkg.repository.url;
  }

  inquirer.prompt([
    {
      name: 'appUrl',
      message: 'What is the URL of your app?',
      default: dirName + '.com'
    }, {
      name: 'appName',
      message: 'What is the name of your app?',
      default: dirName
    }, {
      name: 'appEntryPoint',
      message: 'What\'s you app\'s entry point?',
      default: pkg.main || 'server.js'
    }, {
      name: 'cloneUrl',
      message: 'What is the app\'s git clone URL?',
      default: cloneUrl 
    }, { 
      name: 'branch',
      message: 'What branch will be the source?',
      default: 'master'
    }, {
      name: 'nodeEnv',
      message: 'What NODE_ENV would you like to use?',
      default: 'production'
    }, {
      name: 'upstreamPort',
      message: 'What port is your app listening on?',
      default: 3000
    }, {
      name: 'serverAppPath',
      message: 'What directory should the app be cloned into on the server?',
      default: '/var/www'
    }, {
      name: 'sitesEnabledPath',
      message: 'What is the nginx sites-enabled path?',
      default: '/etc/nginx/sites-enabled'
    }, {
      name: 'sshAddress',
      message: 'What is the server\'s SSH address?'
    }
  ], function (answers) {
    if (!validate(answers)) {
      return;
    }
 
    cb(answers);
    save(targetPath, answers);
    console.log(chalk.green('Created an \'' + path.basename(targetPath) + '\' deploy environment.'));
  });
};

exports.load = function(targetPath, cb) {
  var configPath = getConfigPath(targetPath);

  if (!fs.existsSync(configPath)) {
    return false;
  }
  
  fs.readFile(configPath, function (error, data) {
    if (error) {
      throw new Error(error);
    }

    var config = JSON.parse(data);

    if (!config) {
      console.log(chalk.red('\'' + targetPath + '\' config directory not found in – run `pt init [target]` first'));
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
  if (!config.appEntryPoint)    error('No app entry point was specified');
  if (!config.upstreamPort)     error('No upstream port was specified');
  if (!config.serverAppPath)    error('No server app path was specified');
  if (!config.sitesEnabledPath) error('No nginx sites-enabled path was specified');
  if (!config.cloneUrl)         error('No git clone URL was specified');
  if (!config.sshAddress)       error('No server SSH address was specified');

  if (ok && !config.appUrl.match(/\./))     error('app url must be a valid url');
  if (ok && !config.sshAddress.match(/@/))  error('server SSH address does not specify user');
  if (ok && !parseInt(config.upstreamPort)) error('upstream port must be a valid port number');

  return ok;
}

function save(basePath, config) {
  var configPath = getConfigPath(basePath);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getConfigPath(basePath) {
  return path.join(basePath, configFileName);
}
