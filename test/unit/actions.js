var proxyquire = require('proxyquire'),
  actions = require('../../lib/actions'),
  sinon = require('sinon');

module.exports = function () {
  it('actions throw errors with invalid arguments', function () {
    actions.init.should.throw(Error);
    actions.deploy.should.throw(Error);
    actions.remove.should.throw(Error);
  });
};
