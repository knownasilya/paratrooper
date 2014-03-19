var path = require('path');
var config = require('./config');
var scripts = require('./scripts');
var deploy = require('./deploy');
var pkg = require('../package');

exports.init = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);
  
  config.generate(pkg, targetPath, function (answers) {
    scripts.generate(targetPath, answers);
  });
};

exports.deploy = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);

  config.load(targetPath, function(settings) {
    deploy.run(settings);
  });
};

exports.remove = function (target, options) {
  var targetPath = normalizeTarget(target, options.directory);
  debugger;
  config.load(targetPath, function(settings) {
    debugger;
    deploy.remove(settings);
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
