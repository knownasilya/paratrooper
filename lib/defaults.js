var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var async = require('async');

var findGitUrl = function(onComplete) {
  exec('git config --get remote.origin.url', function(err, stdout) {
    return onComplete(null, !err && stdout.trim());
  });
};

var findUpstreamPort = function(onComplete) {
  var cmd = 'cat *.js | grep -Eho ".listen\\(.*)" | grep -Eho "\\d+[, ,) )]" | grep -Eho "\\d+"';

  exec(cmd, function(err, stdout) {
    return onComplete(null, !err && stdout.trim());
  });
};

var findEntryPoint = function(onComplete) {
  fs.readFile('package.json', 'utf8', function(err, data) {
    if (err || !data) return onComplete(null);
    var pkg = JSON.parse(data);
    return onComplete(null, pkg.main);
  });
};

var find = function(onComplete) {
  async.series([findGitUrl, findUpstreamPort, findEntryPoint], function(err, results) {
    return onComplete({
      url: results[0],
      port: results[1],
      name: path.basename(process.cwd()),
      entry: results[2],
      path: '/var/www',
      nginx: '/etc/nginx/sites-enabled'
    });
  });
};

module.exports = {
  find: find
};
