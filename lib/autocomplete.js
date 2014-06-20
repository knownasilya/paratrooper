var omelette = require('omelette');
var command = omelette('paratrooper|pt <action>');

command.on('action', actionReply);

module.exports = function () {
  command.init();
  command.setupShellInitFile();
};

function actionReply() {
  return this.reply(['init', 'deploy', 'remove']);
}
