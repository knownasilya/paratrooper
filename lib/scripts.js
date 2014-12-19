'use strict';

var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');
var mkdirp = require('mkdirp');
var unixPathJoin = require('./utils/unix-path-join');
var templatesPath = path.join(__dirname, 'templates');

function generateStencil(type, settings) {
  var templatePath = path.join(templatesPath, type + '.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);

  return stencil(settings);
};

exports.generate = function (targetPath, settings) {
  if (!fs.existsSync(targetPath)) {
    mkdirp.sync(targetPath);
  }

  fs.writeFileSync(path.join(targetPath, settings.appName + '.conf'),
    generateStencil('upstart', settings));

  fs.writeFileSync(path.join(targetPath, settings.appName),
    generateStencil('nginx', settings));
};

exports.verify = function createVerifyScript(settings) {
  var templatePath = path.join(__dirname, 'templates', 'verify.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);

  return stencil({
    appName: settings.appName
  });
};

exports.remove = function createRemoveScript(settings) {
  var templatePath = path.join(__dirname, 'templates', 'remove.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = Handlebars.compile(template);

  // check that application exists
  return stencil({
    appName: settings.appName,
    appPath: unixPathJoin(settings.serverAppPath, settings.appName),
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxConfig: unixPathJoin(settings.sitesEnabledPath, settings.appName),
    upstartConfig: unixPathJoin('/etc/init', settings.appName + '.conf')
  });
};

exports.deploy = function createDeployScript(settings) {
  var repoPath = unixPathJoin(settings.serverAppPath, settings.appUrl);
  var templatePath = path.join(__dirname, 'templates', 'deploy.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var appConfigName = settings.appConfigName || 'config.json';
  var stencil = Handlebars.compile(template);
  var options = {
    repoPath: repoPath,
    appPath: unixPathJoin(repoPath, settings.rootPath),
    appName: settings.appName,
    branch: settings.branch,
    cloneUrl: settings.cloneUrl,
    serverAppPath: settings.serverAppPath,
    sitesEnabledPath: settings.sitesEnabledPath,
    nginxFrom: unixPathJoin(repoPath, settings.directory, settings.appName),
    nginxTo: unixPathJoin(settings.sitesEnabledPath, settings.appName),
    upstartFrom: unixPathJoin(repoPath, settings.directory, settings.appName + '.conf'),
    upstartTo: unixPathJoin('/etc/init', settings.appName + '.conf'),
    appConfig: unixPathJoin(repoPath, settings.directory, appConfigName),
    appConfigName: appConfigName,
    npmScript: settings.npmScript,
    errors: {
      cloning: 'failed to clone ' + settings.cloneUrl,
      branchCheckout: 'failed to checkout tracking branch ' + settings.branch,
      branchPull: 'failed to pull changes on ' + settings.branch
    }
  };

  var deployScript = stencil(options);

  if (settings.debug) {
    console.log(deployScript);
  }

  return deployScript;
};
