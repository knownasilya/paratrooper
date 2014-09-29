'use strict';

var test = require('prova');
var fs = require('fs');
var path = require('path');
var configTests = require('./unit/config');
var actionsTests = require('./unit/actions');
var tmpDir = path.join(__dirname, 'data');

test('Unit', function (t) {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  t.test('::CONFIG::', configTests);
  t.test('::ACTIONS::', actionsTests);
});
