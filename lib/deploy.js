var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var chalk = require('chalk');
var handlebars = require('handlebars');

exports.run = function (settings) {
  function verify() {
    execute(settings.sshAddress, createVerifyScript(settings));
  }

  console.log('deploying ' + settings.branch + ' ' 
    + 'to ' + settings.sshAddress + ':' + settings.serverAppPath + '/' + settings.appName + '..');

  execute(settings.sshAddress, createDeployScript(settings), function(output) {
    console.log(chalk.green('deploy ok') + ' – ' + chalk.yellow('verifying..'));
    setTimeout(verify, 15000);
  });
};

exports.remove = function (settings) {
  execute(settings.sshAddress, createRemoveScript(settings), function () {
    console.log('removing ' + settings.sshAddress + ':'
      + settings.serverAppPath + '/' + settings.appName + '..');
  });
};

function checkForError(message) {
  return 'if [ \\$? -ne 0 ] ; then '
       + '  echo error: ' + message + ' ; exit 1 ; '
       + 'fi ; ';
}

function createDeployScript(settings) {
  var apppath = path.join(settings.serverAppPath, settings.appName);

  var nginxFrom = path.join(apppath, settings.directory, settings.appName);
  var nginxTo = path.join(settings.sitesEnabledPath, settings.appName);

  var upstartFrom = path.join(apppath, settings.directory, settings.appName + '.conf');
  var upstartTo = path.join('/etc/init', settings.appName + '.conf');

  // check server has required dependencies
  return 'for dependency in nginx git node npm ; do '
       + 'if ! which \\$dependency > /dev/null ; then '
       + '  echo error: server missing is nginx, git, node or npm ; '
       + '  exit 1 ; '
       + 'fi ; '
       + 'done ; '

       // check the supplied sites-enabled path is valid
       + 'if [ ! -d \\"' + settings.sitesEnabledPath + '\\" ] ; then '
       + '  echo error: nginx sites-enabled path ' + settings.sitesEnabledPath + ' does not exist ; '
       + '  exit 1 ; '
       + 'fi ; '

       // add SSH exception for github.com in order to connect without interruption
       + 'if ! grep -Fxq \\"Host github.com\\" ~/.ssh/config ; then '
       + '  echo -e \\"Host github.com\\n\\tStrictHostKeyChecking no\\n\\" >> ~/.ssh/config ;'
       + 'fi ;'

       // create the 'app path on server' directory if it doesn't exist
       + 'if [ ! -d \\"' + settings.serverAppPath + '\\" ] ; then '
       + '  mkdir -p \\"' + settings.serverAppPath + '\\" ; '
       + 'fi ; '

       // stop any existing app instance
       + 'stop ' + settings.appName + ' > /dev/null ; '

       // if there's no repo, clone it for the first time
       + 'if [ ! -d \\"' + apppath + '\\" ] ; then '
       + '  git clone ' + settings.cloneUrl + ' \\"' + apppath + '\\" > /dev/null ; '
       + checkForError('failed to clone ' + settings.cloneUrl)
       + 'fi ; '

       // move into application directory
       + 'cd \\"' + apppath + '\\" ; '

       // fetch upstream changes on all branches
       + 'git fetch > /dev/null ; '
       + checkForError('failed to fetch upstream changes')

       // create tracking branch – may fail if there's already one, but that's ok
       + 'git branch ' + settings.branch + ' origin/' + settings.branch + ' > /dev/null ; '

       // checkout new/existing tracking branch
       + 'git checkout ' + settings.branch + ' > /dev/null ; '
       + checkForError('failed to checkout tracking branch ' + settings.branch)

       // pull latest changes from branch
       + 'git pull origin ' + settings.branch + ' > /dev/null ; '
       + checkForError('failed to pull changes on ' + settings.branch)

       // install missing npm dependencies
       + 'npm install > /dev/null ; '
       + checkForError('failed to install npm dependencies')

       // copy the nginx and upstart config files to correct locations
       + 'cp -f \\"' + nginxFrom + '\\" ' + nginxTo + ' ; '
       + 'cp -f \\"' + upstartFrom + '\\" ' + upstartTo + ' ; '

       // reload nginx config
       + 'nginx -s reload > /dev/null ; '
       + checkForError('failed to reload nginx configuration')

       // start a new app instance
       + 'start ' + settings.appName + ' > /dev/null ; '
       + checkForError('application failed to start')
       + 'exit ; ';
}

function createVerifyScript(settings) {
  return 'initctl status \\"' + settings.appName + '\\" | grep process > /dev/null ; '
       + checkForError('application failed to start');
}

function createRemoveScript(settings) {
  var templatePath = path.join(__dirname, 'templates', 'remove.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = handlebars.compile(template);

  // check that application exists
  return stencil({
    appName: settings.appName,
    appPath: path.join(settings.serverAppPath, settings.appName),
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxConfig: path.join(settings.sitesEnabledPath, settings.appName),
    upstartConfig: path.join('/etc/init', settings.appName + '.conf')
  });
}

function execute(server, commands, onComplete) {
  console.log('establishing connection with ssh server `' + server);
  exec('ssh -A ' + server + ' "' + commands + '"', function(err, output) {
    if (output) console.log(output.trim());

    if (err) {
      if (!output) console.log(chalk.red('error: failed to connect to server'));
      console.log(chalk.red(err));

      process.exit(1);
    }

    onComplete && onComplete();
  });
}
