var actions = require('../../lib/actions');

module.exports = function (d) {
  d.test('actions throw errors with invalid arguments', function (t) {
    t.throws(actions.init, Error);
    t.throws(actions.deploy, Error);
    t.throws(actions.remove, Error);
    t.end();
  });
};
