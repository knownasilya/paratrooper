var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var templatesPath = path.join(__dirname, 'templates');

function generateStencil(type, settings) {
  var templatePath = path.join(templatesPath, type + '.hbs');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var stencil = handlebars.compile(template);

  return stencil(settings);
};

var generate = function(directory, settings) {
  if (!fs.existsSync(directory)) {
    console.log(directory);
    fs.mkdirSync(directory);
  }

  fs.writeFileSync(path.join(directory, settings.name + '.conf'), 
    generateStencil('upstart', settings));

  fs.writeFileSync(path.join(directory, settings.name), 
    generateStencil('nginx', settings));
};

module.exports = {
  generate: generate
};
