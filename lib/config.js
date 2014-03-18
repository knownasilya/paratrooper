var fs = require('fs');
var async = require('async');
var readline = require('readline');
var chalk = require('chalk');
var defaults = require('./defaults');

var generate = function(onComplete) {
  var askQuestions = function(options, onComplete) {
    var io = readline.createInterface({ input: process.stdin, output: process.stdout });

    var allQuestionsAnswered = function(err, answers) {
      io.close();

      return onComplete({
        appurl: answers[0] ? answers[0] : options.appurl,
        name:   answers[1] ? answers[1] : options.name,
        entry:  answers[2] ? answers[2] : options.entry,
        port:   answers[3] ? answers[3] : options.port,
        path:   answers[4] ? answers[4] : options.path,
        nginx:  answers[5] ? answers[5] : options.nginx,
        url:    answers[6] ? answers[6] : options.url,
        server: answers[7]
      });
    };

    var success = function(cb) {
      return function(value) {
        cb(null, value);
      };
    };

    var wrapDefault = function(value) {
      return value ? ' (' + value + '): ' : ': ';
    };

    async.series([
      function(cb) {
        io.question('app url: ', success(cb));
      },
      function(cb) {
        io.question('app name' + wrapDefault(options.name), success(cb));
      },
      function(cb) {
        io.question('app entry point' + wrapDefault(options.entry), success(cb));
      },
      function(cb) {
        io.question('upstream port' + wrapDefault(options.port), success(cb));
      },
      function(cb) {
        io.question('app path on server' + wrapDefault(options.path), success(cb));
      },
      function(cb) {
        io.question('nginx sites-enabled path' + wrapDefault(options.nginx), success(cb));
      },
      function(cb) {
        io.question('git clone URL' + wrapDefault(options.url), success(cb));
      },
      function(cb) {
        io.question('server SSH address: ', success(cb));
      }
    ], allQuestionsAnswered);
  };

  defaults.find(function(options) {
    return askQuestions(options, onComplete);
  });
};

var validate = function(config) {
  var ok = true;

  var error = function(message) {
    console.log(chalk.red('Error: ') + message);
    ok = false;
  };

  if (!config.appurl) error('No app url was specified');
  if (!config.name)   error('No app name was specified');
  if (!config.entry)  error('No app entry point was specified');
  if (!config.port)   error('No upstream port was specified');
  if (!config.path)   error('No server app path was specified');
  if (!config.nginx)  error('No nginx sites-enabled path was specified');
  if (!config.url)    error('No git clone URL was specified');
  if (!config.server) error('No server SSH address was specified');

  if (ok && !config.appurl.match(/\./)) error('app url must be a valid url');
  if (ok && !config.server.match(/@/))  error('server SSH address does not specify user');
  if (ok && !parseInt(config.port))     error('upstream port must be a valid port number');

  return ok;
};

var save = function(path, config) {
  fs.writeFileSync(path, JSON.stringify(config));
};

var load = function(path) {
  if (!fs.existsSync(path)) {
    return false;
  }

  return JSON.parse(fs.readFileSync(path));
};

module.exports = {
  generate: generate,
  validate: validate,
  save: save,
  load: load
};
