'use strict';

var fs = require('fs');
var path = require('path');
var Liftoff = require('liftoff');
var program = require('ltcdr');
var updateNotifier = require('update-notifier');
var actions = require('../lib/actions');
var pkg = require('../package.json');

var paratrooper = new Liftoff({
  name: 'paratrooper',
  configName: '.paratrooper',
  extensions: {
    'rc': null
  }
});

module.exports = function (cb) {
  updateNotifier({ pkg: pkg }).notify();

  paratrooper.launch({}, function (env) {

    if (env.configPath) {
      fs.readFile(env.configPath, function (err, data) {
        if (err) {
          return console.error(err);
        }

        var config = {};
        var plugin;

        try {
          config = JSON.parse(data);
        } catch(e) {
          console.error(e);
        }

        if (config.plugin) {
          plugin = require(path.join(env.cwd, 'node_modules', config.plugin));
        } else {
          plugin = require('paratrooper-basic');
        }

        cb(initProgram(config, plugin));
      });
    }
    else {
      cb(initProgram());
    }
  });
};

function initProgram(config, plugin) {
  config = config || {};
  config.directory = config.directory || 'deploy';
  config.rootPath = config.rootPath || '';

  program
    .version(pkg.version)
    .usage('<init|deploy|remove> [options]')

  // init action
  program.command('init [target]')
    .alias('i')
    .description('Initializes the configuration files for the given [target] environment')
    .option('-d, --directory <directory>', 'directory for deploy configuration files', config.directory)
    .option('-r, --root-path <directory>', 'directory within project that is to be deployed', config.rootPath)
    .option('-D, --debug', 'Enables verbose output while running commands', config.debug)
    .action(function (target, options) {
      actions.init(target, options, config, plugin);
    })

  // deploy action
  program.command('deploy [target]')
    .alias('d')
    .description('Deploys the application, first run `pt init` to setup the deployment')
    .option('-d, --directory <path>', 'directory for deploy configuration files', config.directory)
    .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file', config.sshIdentityFile)
    .option('-D, --debug', 'Enables verbose output while running commands', config.debug)
    .option('-u, --user <user>', 'Override the ssh user that is set in the config', config.user)
    .action(function (target, options) {
      actions.deploy(target, options, config, plugin);
    })

  // remove action
  program.command('remove [target]')
    .alias('r')
    .description('Stops and removes the application from the server')
    .option('-d, --directory <directory>', 'directory for deploy configuration files', config.directory)
    .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file', config.sshIdentityFile)
    .option('-D, --debug', 'Enables verbose output while running commands', config.debug)
    .option('-u, --user <user>', 'Override the ssh user that is set in the config', config.user)
    .action(function (target, options) {
      actions.remove(target, options, config, plugin);
    })

  // catchall
  program.command('*')
    .action(actions.catchAll)

  return program;
}
