var fs = require('fs');
var readline = require('readline');
var chalk = require('chalk');
var defaults = require('./defaults');

exports.generate = function(onComplete) {
  function askQuestions(options, onComplete) {
    var io = readline.createInterface({ input: process.stdin, output: process.stdout });

    function allQuestionsAnswered(err, answers) {
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
    }

    function success(cb) {
      return function(value) {
        cb(null, value);
      };
    }

    function wrapDefault(value) {
      return value ? ' (' + value + '): ' : ': ';
    }
    var answers = [];
    var questions = [
      'app url: ',
      'app name' + wrapDefault(options.name),
      'app entry point' + wrapDefault(options.entry),
      'upstream port' + wrapDefault(options.port),
      'app path on server' + wrapDefault(options.path),
      'nginx sites-enabled path' + wrapDefault(options.nginx),
      'git clone URL' + wrapDefault(options.url),
      'server SSH address: '
    ];
    var i = 0;
    var len = questions.length;
    function makeCallback(i) {
      return function (err, value) {
        answers[i] = value;
        if (++i === len) {
          allQuestionsAnswered(null, answers);
        } else {
          io.question(questions[i], success(makeCallback(i)));
        }
      };
    }
    io.question(questions[0], success(makeCallback(0)));
  }

  defaults.find(function(options) {
    return askQuestions(options, onComplete);
  });
};

exports.validate = function(config) {
  var ok = true;

  function error(message) {
    console.log(chalk.red('Error: ') + message);
    ok = false;
  }

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

exports.save = function(path, config) {
  fs.writeFileSync(path, JSON.stringify(config));
};

exports.load = function(path) {
  if (!fs.existsSync(path)) {
    return false;
  }

  return JSON.parse(fs.readFileSync(path));
};
