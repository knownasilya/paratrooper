'use strict';

var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var Handlebars = require('handlebars');
var execute = require('./execute');
var loadErrorCheckHelper = require('./helpers/error-check');
var loadVerboseHelper = require('./helpers/verbose');

loadErrorCheckHelper(Handlebars);
loadVerboseHelper(Handlebars);

module.exports = function deploy(settings, identityFile) {
  if (identityFile && !fs.existsSync(identityFile)) {
    throw new Error(chalk.red('ssh identity file not found'));
  }

  console.log('deploying ' + settings.branch + ' '
    + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');

  execute(settings, identityFile, function (err) {
    if (err) {
      console.error(chalk.red('Deploy failed: ' + err));
      process.exit(1);
    }

    console.log(chalk.green('Success!'));
    process.exit(0);
  });
};
