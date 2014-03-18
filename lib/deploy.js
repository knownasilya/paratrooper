var path = require('path');
var exec = require('child_process').exec;

var checkForError = function(message) {
  return 'if [ \\$? -ne 0 ] ; then '
       + '  echo error: ' + message + ' ; exit 1 ; '
       + 'fi ; ';
};

var createDeployScript = function(settings) {
  var apppath = path.join(settings.path, settings.name);

  var nginxFrom = path.join(apppath, settings.directory, settings.name);
  var nginxTo = path.join(settings.nginx, settings.name);

  var upstartFrom = path.join(apppath, settings.directory, settings.name + '.conf');
  var upstartTo = path.join('/etc/init', settings.name + '.conf');

  // check server has required dependencies
  return 'for dependency in nginx git node npm ; do '
       + 'if ! which \\$dependency > /dev/null ; then '
       + '  echo error: server missing is nginx, git, node or npm ; '
       + '  exit 1 ; '
       + 'fi ; '
       + 'done ; '

       // check the supplied sites-enabled path is valid
       + 'if [ ! -d \\"' + settings.nginx + '\\" ] ; then '
       + '  echo error: nginx sites-enabled path ' + settings.nginx + ' does not exist ; '
       + '  exit 1 ; '
       + 'fi ; '

       // add SSH exception for github.com in order to connect without interruption
       + 'if ! grep -Fxq \\"Host github.com\\" ~/.ssh/config ; then '
       + '  echo -e \\"Host github.com\\n\\tStrictHostKeyChecking no\\n\\" >> ~/.ssh/config ;'
       + 'fi ;'

       // create the 'app path on server' directory if it doesn't exist
       + 'if [ ! -d \\"' + settings.path + '\\" ] ; then '
       + '  mkdir -p \\"' + settings.path + '\\" ; '
       + 'fi ; '

       // stop any existing app instance
       + 'stop ' + settings.name + ' > /dev/null ; '

       // if there's no repo, clone it for the first time
       + 'if [ ! -d \\"' + apppath + '\\" ] ; then '
       + '  git clone ' + settings.url + ' \\"' + apppath + '\\" > /dev/null ; '
       + checkForError('failed to clone ' + settings.url)
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
       + 'start ' + settings.name + ' > /dev/null ; '
       + checkForError('application failed to start')
       + 'exit ; ';
};

var createVerifyScript = function(settings) {
  return 'initctl status \\"' + settings.name + '\\" | grep process > /dev/null ; '
       + checkForError('application failed to start');
};

var createRemoveScript = function(settings) {
  var apppath = path.join(settings.path, settings.name);
  var nginxConfig = path.join(settings.nginx, settings.name);
  var upstartConfig = path.join('/etc/init', settings.name + '.conf');

  // check that application exists
  return 'if [ ! -d \\"' + apppath + '\\" ] ; then '
       + '  echo error: application path ' + apppath + ' does not exist ; '
       + '  exit 1 ; '
       + 'fi ; '

       // check that the nginx sites-enabled directory exists
       + 'if [ ! -d \\"' + settings.nginx + '\\" ] ; then '
       + '  echo error: nginx sites-enabled path ' + settings.nginx + ' does not exist ; '
       + '  exit 1 ; '
       + 'fi ; '

       // stop any existing app instance
       + 'stop ' + settings.name + ' > /dev/null ; '

       // remove config files and app directory
       + 'rm -f \\"' + nginxConfig + '\\" ; '
       + 'rm -f \\"' + upstartConfig + '\\" ; '
       + 'rm -rf \\"' + apppath + '\\" ; '

       // reload nginx config
       + 'nginx -s reload > /dev/null ; ';
};

var execute = function(server, commands, onComplete) {
  exec('ssh -A ' + server + ' "' + commands + '"', function(err, output) {
    if (output) console.log(output.trim());

    if (err) {
      if (!output) console.log('error: failed to connect to server');

      process.exit(1);
    }

    onComplete && onComplete();
  });
};

var run = function(settings) {
  var verify = function() {
    execute(settings.server, createVerifyScript(settings));
  };

  execute(settings.server, createDeployScript(settings), function(output) {
    console.log('deploy ok – verifying');
    setTimeout(verify, 15000);
  });
};

var remove = function(settings) {
  execute(settings.server, createRemoveScript(settings));
};

module.exports = {
  run: run,
  remove: remove
};
