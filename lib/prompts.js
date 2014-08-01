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
      default: data.cloneUrl 
    }, { 
      name: 'branch',
      message: 'Which branch should be used for deployment?',
      default: 'master'
    }, {
      name: 'nodeEnv',
      message: 'What value would you like to use for NODE_ENV?',
      default: 'production'
    }, {
      name: 'upstreamPort',
      message: 'What port is your app listening on?',
      default: 3000
    }, {
      name: 'sshAddress',
      message: 'What is the server\'s SSH address?'
    }, {
      name: 'runNpmScript',
      type: 'expand',
      message: 'Would you like to run an npm script after `postinstall` runs?',
      choices: [
        { key: 'Y', name: 'Yes', value: true },
        { key: 'n', name: 'No', value: false }
      ],
      when: function () {
        return npmScripts.length > 0;
      },
      default: 0
    }, {
      name: 'npmScripts',
      type: 'list',
      message: 'Which npm script would you like to run?',
      choices: npmScripts,
      when: function (answers) {
        return answers.runNpmScript;
      }
    }
  ];
};
