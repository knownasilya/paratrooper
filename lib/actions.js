var path = require('path');
var chalk = require('chalk');
var config = require('./config');
var scripts = require('./scripts');
var deployment = require('./deploy');
var pkg = require('../package');
var configDir = 'deploy';
var settingsFileName = 'deploy.json';

exports.init = function init(target, options) {
  var directory = options.directory || 'deploy';

  target = target || 'production';
  
  config.generate(pkg, function (answers) {
    if (!config.validate(answers)) {
      return;
    }

    var configPath = path.join(directory, settingsFileName);

    scripts.generate(directory, answers);
    config.save(configPath, answers);
    console.log(chalk.green('Created an \'' + target + '\' deploy environment.'));
  });
};

exports.deploy = function deploy() {
  getSettings(function(settings) {
    console.log('deploying ' + settings.branch + ' ' 
      + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');
    deployment.run(settings);
  });
};

exports.remove = function remove() {
  getSettings(function(settings) {
    console.log('removing ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');
    deployment.remove(settings);
  });
};

exports.catchAll = function catchAll() {
  console.log('please use one of the following commands: init, deploy, remove');  
};

function getSettings(onFound) {
  var settings = config.load(configDir + '/deploy.json');

  configDir = settings.directory || configDir;

  if (!settings) {
    console.log(chalk.red('\'' + configDir + '\' config directory not found in – run [nd init] first'));
    return process.exit(1);
  }

  settings.directory = configDir;
  settings.branch = settings.branch;

  return onFound(settings);
}
