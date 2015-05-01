'use strict';

module.exports = function (Handlebars) {
  Handlebars.registerHelper('verbose', function (debug) {
    var result = debug ? '' : ' > /dev/null';

    return new Handlebars.SafeString(result);
  });
};
