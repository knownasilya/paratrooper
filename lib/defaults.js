var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

function findGitUrl(onComplete) {
  exec('git config --get remote.origin.url', function(err, stdout) {
    return onComplete(null, !err && stdout.trim());
  });
}

function findUpstreamPort(onComplete) {
  var cmd = 'cat *.js | grep -Eho ".listen\\(.*)" | grep -Eho "\\d+[, ,) )]" | grep -Eho "\\d+"';

  exec(cmd, function(err, stdout) {
    return onComplete(null, !err && stdout.trim());
  });
}

function findEntryPoint(onComplete) {
  fs.readFile('package.json', 'utf8', function(err, data) {
    if (err || !data) return onComplete(null);
    var pkg = JSON.parse(data);
    return onComplete(null, pkg.main);
  });
}

exports.find = function(onComplete) {
  function last(err, results) {
    return onComplete({
      url: results[0],
      port: results[1],
      name: path.basename(process.cwd()),
      entry: results[2],
      path: '/var/www',
      nginx: '/etc/nginx/sites-enabled'
    });
  }
  findGitUrl(function () {
    findUpstreamPort(function () {
      findEntryPoint(last);
    });
  });
};