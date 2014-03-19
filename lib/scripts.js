var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var mkdirp = require('mkdirp');
var templatesPath = path.join(__dirname, 'templates');

function generateStencil(type, settings) {
  var templatePath = path.join(templatesPath, type + '.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = handlebars.compile(template);

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
