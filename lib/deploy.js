var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var chalk = require('chalk');
var Handlebars = require('handlebars');

Handlebars.registerHelper('errorCheck', function(message) {
  message = Handlebars.Utils.escapeExpression(message);

  var result = 'if [ \\$? -ne 0 ]; then'
             + '  echo error: ' + message + '; exit 1;'
             + 'fi;';

  return new Handlebars.SafeString(result);
});

exports.run = function (settings, identityFile) {
  function verify() {
    execute(settings.sshAddress, identityFile, createVerifyScript(settings));
  }

  if (identityFile && !fs.existsSync(identityFile)) {
    throw new Error(chalk.red('ssh identity file not found'));
  }

  console.log('deploying ' + settings.branch + ' ' 
    + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');

  execute(settings.sshAddress, identityFile, createDeployScript(settings), function(output) {
    console.log(chalk.green('deploy ok') + ' – ' + chalk.yellow('verifying..'));
    setTimeout(verify, 15000);
  });
};

exports.remove = function (settings, identityFile) {
  execute(settings.sshAddress, identityFile, createRemoveScript(settings), function () {
    console.log('removing ' + settings.sshAddress + ':'
      + settings.serverAppPath + '/' + settings.appName + '..');
  });
};

function createDeployScript(settings) {
  var appPath =  path.join(settings.serverAppPath, settings.appUrl);
  var templatePath = path.join(__dirname, 'templates', 'deploy.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);
  var options = {
    appPath: appPath,
    appName: settings.appName,
    branch: settings.branch,
    cloneUrl: settings.cloneUrl,
    serverAppPath: settings.serverAppPath,
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxFrom: path.join(appPath, settings.directory, settings.appName),
    nginxTo: path.join(settings.sitesEnabledPath, settings.appName),
    upstartFrom: path.join(appPath, settings.directory, settings.appName + '.conf'),
    upstartTo: path.join('/etc/init', settings.appName + '.conf'),
    errors: {
      cloning: 'failed to clone ' + settings.cloneUrl,
      branchCheckout: 'failed to checkout tracking branch ' + settings.branch,
      branchPull: 'failed to pull changes on ' + settings.branch
    }
  };

  return stencil(options);
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
    appPath: path.join(settings.serverAppPath, settings.appName),
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxConfig: path.join(settings.sitesEnabledPath, settings.appName),
    upstartConfig: path.join('/etc/init', settings.appName + '.conf')
  });
}

function execute(server, identityFile, commands, onComplete) {
  console.log('establishing connection with ssh server `' + server + '`');
  identityFile = identityFile ? '-i ' + identityFile : '';

  exec('ssh -A ' + identityFile + ' ' + server + ' "' + commands + '"', function(err, output) {
    if (output) console.log(output.trim());

    if (err) {
      if (!output) console.log(chalk.red('error: failed to connect to server'));
      console.log(chalk.red(err));

      process.exit(1);
    }

    onComplete && onComplete();
  });
}
