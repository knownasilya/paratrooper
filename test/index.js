var test = require('tape');

test('an example test', function (t) {
  var x = 'a string';
  t.is(x, 'a string', 'example test');
  t.end();
});