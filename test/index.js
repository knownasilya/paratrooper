var chai = require('chai');
  configTests = require('./unit/config'),
  actionsTests = require('./unit/actions');

chai.should();

describe('Unit', function () {
  describe('config', configTests);
  describe('actions', actionsTests);
});
