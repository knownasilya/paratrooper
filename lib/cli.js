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
  .option('-d, --directory <directory>', 'directory for deploy configuration files')
  .option('-r, --root-path <directory>', 'directory within project that is to be deployed', '/')
  .action(actions.init)

// deploy action
program.command('deploy [target]')
  .alias('d')
  .option('-d, --directory <path>', 'directory for deploy configuration files')
  .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file')
  .action(actions.deploy)

// remove action
program.command('remove [target]')
  .alias('r')
  .option('-d, --directory <directory>', 'directory for deploy configuration files')
  .option('-i, --ssh-identity-file <path>', 'pass through of the ssh identity file')
  .action(actions.remove)

// catchall
program.command('*')
  .action(actions.catchAll)

module.exports = program;
