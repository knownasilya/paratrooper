var test = require('tape'), 
  fs = require('fs'),
  path = require('path'),
  configTests = require('./unit/config'),
  actionsTests = require('./unit/actions'),
  tmpDir = path.join(__dirname, 'data');

test('Unit', function (t) {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  t.test('::CONFIG::', configTests);
  t.test('::ACTIONS::', actionsTests);
});
