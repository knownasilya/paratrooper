'use strict';

var inquirer = require('inquirer');

module.exports = function (data) {
  var appName = data.appName;
  var npmScripts = data.scriptKeys.filter(function (key) {
    return key !== 'install' && key !== 'postinstall';
  });

  return [
    {
      name: 'appUrl',
      message: 'What is the URL of your app?',
      default: appName.indexOf('.com') === -1 ? appName + '.com' : appName
    }, {
      name: 'cloneUrl',
      message: 'What is the app\'s git clone URL?',
      default: data.cloneUrl,
      validate: function (url) {
        if (!url) {
          return 'Cannot be blank';
        }

        return true;
      }
    }, {
      name: 'branch',
      message: 'Which branch should be used for deployment?',
      default: 'master'
    }, {
      name: 'nodeEnv',
      message: 'What value would you like to use for NODE_ENV?',
      default: 'production'
    }, {
      name: 'nodeVersion',
      message: 'What version of Node.js would you like to use?',
      default: 'latest'
    }, {
      name: 'upstreamPort',
      message: 'What port is your app listening on?',
      default: 3000
    }, {
      name: 'sshAddress',
      message: 'What is the server\'s SSH address?',
      validate: function (address) {
        if (!address) {
          return 'Cannot be blank';
        }

        var split = address.split('@');

        if (split.length === 2 && split[0].length) {
          return true;
        }

        return 'Must have an \'@\' somewhere in the middle, e.g. me@myserver';
      }
    }, {
      name: 'runNpmScript',
      type: 'expand',
      message: 'Would you like to run an npm script after `postinstall` runs?',
      default: 0,
      choices: [
        { key: 'n', name: 'No', value: false },
        { key: 'y', name: 'Yes', value: true }
      ],
      when: function () {
        return npmScripts.length > 0;
      }
    }, {
      name: 'npmScript',
      type: 'list',
      message: 'Which npm script would you like to run?',
      choices: npmScripts,
      when: function (answers) {
        return answers.runNpmScript;
      }
    }, {
      name: 'npmInstallArguments',
      message: 'Arguments for `npm install`, e.g. \'--production\'.'
    }
  ];
};
