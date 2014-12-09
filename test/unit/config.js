var proxyquire = require('proxyquire');
var fs = require('fs');
var pkg = {
  name: 'tmp',
  repository: {
    type: 'git',
    url: 'http://hellotest.git'
  }
};
var mockAnswers = {
  appUrl: 'tmp.com',
  cloneUrl: 'http://hellotest.git',
  branch: 'master',
  nodeEnv: 'production',
  upstreamPort: 3000,
  sshAddress: 'root@localhost'
};
var validConfig = {
  appUrl: 'tmp.com',
  appName: 'tmp.com',
  cloneUrl: 'http://hellotest.git',
  branch: 'master',
  nodeEnv: 'production',
  rootPath: '',
  upstreamPort: 3000,
  serverAppPath: '/var/www',
  sitesEnabledPath: '/etc/nginx/sites-enabled',
  sshAddress: 'root@localhost'
};

config = proxyquire('../../lib/config', {
  inquirer: {
    prompt: promptStub
  }
});

module.exports = function (d) {
  var root = process.cwd();

  process.chdir('test/data');

  d.test('generates default target', function (t) {
    config.generate({
      pkg: pkg,
      targetPath: 'deploy/test',
      rootPath: ''
    }, function (answers) {
      t.deepEqual(answers, validConfig);
      t.ok(fs.existsSync('./deploy/test/paratrooper.json'));
      t.end();
    });

  });

  d.test('loads saved config', function (t) {
    var expected = validConfig;

    config.load('deploy/test', function (loaded) {
      t.deepEqual(loaded, expected);
      t.end();
    });
  });
};

function promptStub(prompts, cb) {
  cb(mockAnswers);
}
