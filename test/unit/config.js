var config = require('../../lib/config'),
  validConfig = {
    "appUrl": "tmp.com",
    "appName": "tmp",
    "appEntryPoint": "./bin/paratrooper",
    "cloneUrl": "https://github.com/knownasilya/paratrooper.git",
    "branch": "master",
    "nodeEnv": "production",
    "upstreamPort": 3000,
    "serverAppPath": "/var/www",
    "sitesEnabledPath": "/etc/nginx/sites-enabled",
    "sshAddress": "root@localhost"
  };

module.exports = function () {
  it('generates default target', function () {
    
  });

  it('loads saved config', function (done) {
    var expected = validConfig;

    config.load('tmp/deploy/production', function (loaded) {
      loaded.should.deep.equal(expected);
      done();
    });
  });
};


