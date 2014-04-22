var fs = require('fs');
var readline = require('readline');
var chalk = require('chalk');
var defaults = require('./defaults');
var inquirer = require('inquirer');
var path = require('path');
var configFileName = 'paratrooper.json';

exports.generate = function(pkg, targetPath, cb) {
  pkg = pkg || {};

  var appName = pkg.name,
    cloneUrl;

  if (pkg.repository && pkg.repository.type === 'git') {
    cloneUrl = pkg.repository.url;
  }

  inquirer.prompt([
    {
      name: 'appUrl',
      message: 'What is the URL of your app?',
      default: appName.indexOf('.com') === -1 ? appName + '.com' : appName
    }, {
      name: 'cloneUrl',
      message: 'What is the app\'s git clone URL?',
      default: cloneUrl 
    }, { 
      name: 'branch',
      message: 'Which branch should be used for deployment?',
      default: 'master'
    }, {
      name: 'nodeEnv',
      message: 'What value would you like to use for NODE_ENV?',
      default: 'production'
    }, {
      name: 'upstreamPort',
      message: 'What port is your app listening on?',
      default: 3000
    }, {
      name: 'sshAddress',
      message: 'What is the server\'s SSH address?'
    }
  ], function (answers) {
    answers.appName = answers.appUrl || path.basename(process.cwd());
    answers.serverAppPath = '/var/www';
    answers.sitesEnabledPath = '/etc/nginx/sites-enabled';

    if (!validate(answers)) {
      return;
    }

 
    cb(answers);
    save(targetPath, answers);
    console.log(chalk.green('Created an \'' + path.basename(targetPath) + '\' deploy environment.'));
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

function save(basePath, config) {
  var configPath = getConfigPath(basePath);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getConfigPath(basePath) {
  var configPath = path.join(basePath, configFileName);
  var deprecatedConfigPath = path.join(basePath, 'config.json');

  if (!fs.existsSync(configPath)) {
    if (fs.existsSync(deprecatedConfigPath)) {
      fs.renameSync(deprecatedConfigPath, configPath); 
    }

    if (!fs.existsSync(configPath)) {
      throw new Error(chalk.red('Configuration file not found, please run `pt init [target]` from your project directory.'));
    }
  }

  return configPath;
}
