var path = require('path');
var config = require('./config');
var scripts = require('./scripts');
var deploy = require('./deploy');
var pkg = require(path.join(process.cwd(), 'package'));

exports.init = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);
  
  config.generate(pkg, targetPath, function (answers) {
    scripts.generate(targetPath, answers);
  });
};

exports.deploy = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);

  config.load(targetPath, function(settings) {
    settings.directory = targetPath;
    deploy.run(settings, options.sshIdentityFile);
  });
};

exports.remove = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);

  config.load(targetPath, function(settings) {
    deploy.remove(settings, options.sshIdentityFile);
  });
};

exports.catchAll = function catchAll() {
  console.log('please use one of the following commands: '
    + 'init, deploy, remove - see the help, `pt --help` for more details');  
};

function normalizeTarget(target, directory) {
  target = target || 'production';
  directory = directory || 'deploy';

  return path.join(directory, target);
}
