var chai = require('chai');
  fs = require('fs'),
  path = require('path'),
  configTests = require('./unit/config'),
  actionsTests = require('./unit/actions'),
  tmpDir = path.join(__dirname, 'tmp');

chai.should();

describe('Unit', function () {
  before(function () {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
  });

  describe('config', configTests);
  describe('actions', actionsTests);
});
