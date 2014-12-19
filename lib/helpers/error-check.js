'use strict';

module.exports = function (Handlebars) {
  Handlebars.registerHelper('errorCheck', function (message) {
    message = Handlebars.Utils.escapeExpression(message);

    var result = [
      'if [ $? -ne 0 ]; then',
      '  echo error: ' + message + '; exit 1;',
      'fi;'
    ].join('\n');

    return new Handlebars.SafeString(result);
  });
};
