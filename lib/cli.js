'use strict';

var program = require('ltcdr');
var actions = require('../lib/actions');
var pkg = require('../package.json');

program
  .version(pkg.version)
  .usage('<init|deploy|remove> [options]')

// init action
program.command('init [target]')
  .alias('i')
  .description('Initializes the configuration files for the given [target] environment')
  .option('-d, --directory <directory>', 'directory for deploy configuration files', 'deploy')
  .option('-r, --root-path <directory>', 'directory within project that is to be deployed', '')
  .option('-D, --debug', 'Enables verbose output while running commands')
  .action(actions.init)

// deploy action
program.command('deploy [target]')
  .alias('d')
  .description('Deploys the application, first run `pt init` to setup the deployment')
  .option('-d, --directory <path>', 'directory for deploy configuration files', 'deploy')
  .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file')
  .option('-D, --debug', 'Enables verbose output while running commands')
  .option('-u, --user <user>', 'Override the ssh user that is set in the config')
  .action(actions.deploy)

// remove action
program.command('remove [target]')
  .alias('r')
  .description('Stops and removes the application from the server')
  .option('-d, --directory <directory>', 'directory for deploy configuration files')
  .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file')
  .option('-D, --debug', 'Enables verbose output while running commands')
  .option('-u, --user <user>', 'Override the ssh user that is set in the config')
  .action(actions.remove)

// catchall
program.command('*')
  .action(actions.catchAll)

module.exports = program;
