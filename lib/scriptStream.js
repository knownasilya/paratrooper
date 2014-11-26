'use strict';

var util = require('util');
var Readable = require('readable-stream').Readable;

module.exports = ScriptStream;

util.inherits(ScriptStream, Readable);

function ScriptStream(data) {
  Readable.call(this);

  this._data = data;
}

ScriptStream.prototype._read = function () {
  var data = this._data;

  this.push(data);
  this.push(null);
};
