'use strict';

var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var Handlebars = require('handlebars');
var ScriptStream = require('./script-stream');
var Connection = require('ssh2');
var ssh = new Connection();

Handlebars.registerHelper('errorCheck', function (message) {
  message = Handlebars.Utils.escapeExpression(message);

  var result = 'if [ $? -ne 0 ]; then'
             + '  echo error: ' + message + '; exit 1;'
             + 'fi;';

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
    console.log('removing ' + settings.sshAddress + ':'
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

function execute(settings, identityFile, onComplete) {
  var server = settings.sshAddress;
  var sshOptions = {
    host: server,
    password: settings.sshPassword,
    tryKeyboard: true,
    port: 22,
    readyTimeout: 60000,
    agent: process.env.SSH_AUTH_SOCK,
    agentForward: true,
    debug: true
  };
  var split = server.split('@');

  if (split.length === 2) {
    sshOptions.username = split[0];
    sshOptions.host = split[1];
  }

  if (identityFile) {
    sshOptions.privateKey = fs.readFileSync(identityFile)
  }

  console.log('establishing connection with ssh server `' + server + '`');

  ssh.on('ready', function () {
    // Run Deployment scripts
    ssh.exec('bash -s', function (err, stream) {
      if (err) {
        return onComplete(err);
      }

      // allow us to close stdin but still allow output from server
      stream.allowHalfOpen = true;

      new ScriptStream(createDeployScript(settings))
        .pipe(stream)
        .on('data', function(data, stderr) {
          console.log(data.toString());
        })
        .on('exit', function(code, signal) {
          if (onComplete && code > 0) {
            onComplete(code.toString());
            ssh.end();
            return;
          }

          // Verify Deployment
          ssh.exec('bash -s', function (err, stream) {
            if (err) {
              return onComplete(err);
            }

            // allow us to close stdin but still allow output from server
            stream.allowHalfOpen = true;

            console.log(chalk.green('deploy ok') + ' – ' + chalk.yellow('verifying..'));
            console.log(createVerifyScript(settings));

            new ScriptStream(createVerifyScript(settings))
              .pipe(stream)
              .on('data', function (data, stderr) {
                console.log(data.toString());
              })
              .on('exit', function(code, signal) {
                if (code === 0) {
                  console.log(chalk.green('Successfully deployed application. Visit ' +
                    chalk.underline(settings.appUrl) + ' to see your live application.'));
                }
                else {
                  console.log(chalk.red('Error deploying application (exited with ' + code + ' code), please see the logs: ' +
                    chalk.underline('/var/log/' + settings.appName + '.log') + ' or look in /etc/nginx/logs/'));
                }

                onComplete && onComplete(null, code);
                ssh.end();
              });
          });
        });
    });
  }).connect(sshOptions);

  ssh.on('error', function(err) {
    console.log('Connection :: error :: ' + err);
  });

  ssh.on('debug', function (message) {
    console.log(chalk.yellow(message));
  });
}

function unixPathJoin() {
  return path.join.apply(path, arguments).replace(path.sep, '/');
}
