'use strict';

var path = require('path');

module.exports = function unixPathJoin() {
  return path.join.apply(path, arguments).replace(path.sep, '/');
};
