'use strict';

var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var Handlebars = require('handlebars');
var execute = require('./execute');

Handlebars.registerHelper('errorCheck', function (message) {
  message = Handlebars.Utils.escapeExpression(message);

  var result = [
    'if [ $? -ne 0 ]; then',
    '  echo error: ' + message + '; exit 1;',
    'fi;'
  ].join('\n');

  return new Handlebars.SafeString(result);
});

exports.run = function (settings, identityFile) {
  if (identityFile && !fs.existsSync(identityFile)) {
    throw new Error(chalk.red('ssh identity file not found'));
  }

  console.log('deploying ' + settings.branch + ' '
    + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');

  execute(settings, identityFile, function (err) {
    if (err) {
      throw chalk.red('Deploy failed: ') + err;
    }

    console.log(chalk.green('Success!'));
    process.exit(0);
  });
};

exports.remove = function (settings, identityFile) {
  execute(settings.sshAddress, settings.sshPassword, identityFile, createRemoveScript(settings), function () {
    console.log('Stoping and removing application from ' + settings.sshAddress + ', located at '
      + settings.serverAppPath + '/' + settings.appName + '..');
  });
};

function createDeployScript(settings) {
  var repoPath = unixPathJoin(settings.serverAppPath, settings.appUrl);
  var templatePath = path.join(__dirname, 'templates', 'deploy.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var appConfigName = settings.appConfigName || 'config.json';
  var stencil = Handlebars.compile(template);
  var options = {
    repoPath: repoPath,
    appPath: unixPathJoin(repoPath, settings.rootPath),
    appName: settings.appName,
    branch: settings.branch,
    cloneUrl: settings.cloneUrl,
    serverAppPath: settings.serverAppPath,
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxFrom: unixPathJoin(repoPath, settings.directory, settings.appName),
    nginxTo: unixPathJoin(settings.sitesEnabledPath, settings.appName),
    upstartFrom: unixPathJoin(repoPath, settings.directory, settings.appName + '.conf'),
    upstartTo: unixPathJoin('/etc/init', settings.appName + '.conf'),
    appConfig: unixPathJoin(repoPath, settings.directory, appConfigName),
    appConfigName: appConfigName,
    npmScript: settings.npmScript,
    errors: {
      cloning: 'failed to clone ' + settings.cloneUrl,
      branchCheckout: 'failed to checkout tracking branch ' + settings.branch,
      branchPull: 'failed to pull changes on ' + settings.branch
    }
  };

  var deployScript = stencil(options);

  if (settings.debug) {
    console.log(deployScript);
  }

  return deployScript;
}

function createVerifyScript(settings) {
  var templatePath = path.join(__dirname, 'templates', 'verify.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);

  return stencil({
    appName: settings.appName
  });
}

function createRemoveScript(settings) {
  var templatePath = path.join(__dirname, 'templates', 'remove.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);

  // check that application exists
  return stencil({
    appName: settings.appName,
    appPath: unixPathJoin(settings.serverAppPath, settings.appName),
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxConfig: unixPathJoin(settings.sitesEnabledPath, settings.appName),
    upstartConfig: unixPathJoin('/etc/init', settings.appName + '.conf')
  });
}


function unixPathJoin() {
  return path.join.apply(path, arguments).replace(path.sep, '/');
}
