'use strict';

var fs = require('fs');
var chalk = require('chalk');
var SSH2 = require('ssh2');
var ScriptStream = require('./script-stream');
var scripts = require('./scripts');
var createDeployScript = scripts.deploy;
var createVerifyScript = scripts.verify;
var ssh = new SSH2();
var isWin = /^win/.test(process.platform);

module.exports = function execute(settings, identityFile, onComplete) {
  var server = settings.sshAddress;
  var defaultAgent = isWin ? 'pageant' : undefined;
  var sshOptions = {
    host: server,
    password: settings.sshPassword,
    tryKeyboard: true,
    port: 22,
    readyTimeout: 60000,
    agent: process.env.SSH_AUTH_SOCK || defaultAgent,
    agentForward: true,
    debug: settings.debug
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

      var deployScript = createDeployScript(settings);
      var deployStream = new ScriptStream(deployScript);

      // allow us to close stdin but still allow output from server
      stream.allowHalfOpen = true;

      deployStream.pipe(stream)
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

            var verifyScript = createVerifyScript(settings);
            var verifyStream = new ScriptStream(verifyScript);

            console.log(chalk.green('deploy ok') + ' – ' + chalk.yellow('verifying..'));

            if (settings.debug) {
              console.log(verifyScript);
            }

            verifyStream.pipe(stream)
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
    console.log(chalk.red('Connection Error: ' + err));
  });

  ssh.on('debug', function (message) {
    console.log(chalk.yellow(message));
  });
}
