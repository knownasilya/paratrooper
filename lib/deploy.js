var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var chalk = require('chalk');
var Handlebars = require('handlebars');
var ScriptStream = require('./scriptStream');
var Connection = require('ssh2');
var ssh = new Connection();

Handlebars.registerHelper('errorCheck', function(message) {
  message = Handlebars.Utils.escapeExpression(message);

  var result = 'if [ $? -ne 0 ]; then'
             + '  echo error: ' + message + '; exit 1;'
             + 'fi;';

  return new Handlebars.SafeString(result);
});

exports.run = function (settings, identityFile) {
  function verify() {
    execute(settings.sshAddress, settings.sshPassword,
      identityFile, createVerifyScript(settings));
  }

  if (identityFile && !fs.existsSync(identityFile)) {
    throw new Error(chalk.red('ssh identity file not found'));
  }

  console.log('deploying ' + settings.branch + ' '
    + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');

  
  //fs.writeFileSync(path.join(process.cwd(), '.deploy.sh'), createDeployScript(settings));
  execute(settings.sshAddress, settings.sshPassword,
    identityFile, createDeployScript(settings), function(err) {
    if (err) {
      throw 'Deploy failed';
    }

    console.log(chalk.green('deploy ok') + ' – ' + chalk.yellow('verifying..'));
    setTimeout(verify, 15000);
  });
};

exports.remove = function (settings, identityFile) {
  execute(settings.sshAddress, settings.sshPassword,
  identityFile, createRemoveScript(settings), function () {
    console.log('removing ' + settings.sshAddress + ':'
      + settings.serverAppPath + '/' + settings.appName + '..');
  });
};

function createDeployScript(settings) {
  var appPath =  path.join(settings.serverAppPath, settings.appUrl);
  var templatePath = path.join(__dirname, 'templates', 'deploy.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var appConfigName = settings.appConfigName || 'config.json';
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
    appConfig: path.join(appPath, settings.directory, appConfigName),
    appConfigName: appConfigName,
    errors: {
      cloning: 'failed to clone ' + settings.cloneUrl,
      branchCheckout: 'failed to checkout tracking branch ' + settings.branch,
      branchPull: 'failed to pull changes on ' + settings.branch
    }
  };

  var deployScript = stencil(options);
  console.log(deployScript);
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
    appPath: path.join(settings.serverAppPath, settings.appName),
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxConfig: path.join(settings.sitesEnabledPath, settings.appName),
    upstartConfig: path.join('/etc/init', settings.appName + '.conf')
  });
}

function execute(server, sshPassword, identityFile, commands, onComplete) {
  console.log('establishing connection with ssh server `' + server + '`');

  var sshOptions = {
    host: server,
    password: sshPassword,
    tryKeyboard: true,
    port: 22,
    readyTimeout: 60000,
    agent: process.env.SSH_AUTH_SOCK,
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
  console.log(process.env.SSH_AUTH_SOCK);
  ssh.on('ready', function () {
    ssh.exec('bash -s', function (err, stream) {
      if (err) {
        throw err;
      }

      // allow us to close stdin but still allow output from server
      stream.allowHalfOpen = true;

      new ScriptStream(commands)
      //fs.createReadStream('./.deploy.sh')
        .pipe(stream)
        .on('data', function(data, extended) {
          console.log((extended === 'stderr' ? chalk.red(data.toString()) : data.toString()));
        }).on('exit', function(code, signal) {
          console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
          onComplete && onComplete(code > 0 ? true : false);
          ssh.end();
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
