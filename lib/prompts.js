module.exports = function (data) {
  var appName = data.appName;

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
    }
  ];
};
