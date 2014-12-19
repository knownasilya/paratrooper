'use strict';

var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');
var createRemoveScript = require('./scripts').remove;
var loadErrorCheck = require('./helpers/error-check');

loadErrorCheck(Handlebars);

module.exports = function remove(settings, identityFile) {
  execute(settings.sshAddress, settings.sshPassword, identityFile, createRemoveScript(settings), function () {
    console.log('Stoping and removing application from ' + settings.sshAddress + ', located at '
      + settings.serverAppPath + '/' + settings.appName + '..');
  });
};
