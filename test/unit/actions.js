var actions = require('../../lib/actions');

module.exports = function () {
  it('init throws errors with invalid arguments', function () {
    actions.init.should.throws(Error);
  });

  it('deploy throws errors with invalid arguments', function () {
    actions.deploy.should.throw(Error);
  });
};
