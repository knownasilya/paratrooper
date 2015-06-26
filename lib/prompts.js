'use strict';

var inquirer = require('inquirer');

module.exports = function (data, processPluginPrompts) {
  var appName = data.appName;
  var npmScripts = data.scriptKeys.filter(function (key) {
    return key !== 'install' && key !== 'postinstall';
  });

  var defaultPrompts = [
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
    }
  ];

  if (typeof processPluginPrompts === 'function') {
    var additionalPrompts = processPluginPrompts(data) || [];

    return defaultPrompts.concat(additionalPrompts);
  }

  return defaultPrompts;
};
