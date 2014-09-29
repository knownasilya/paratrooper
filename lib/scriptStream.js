'use strict';

var util = require('util');
var Readable = require('readable-stream').Readable;

module.exports = ScriptStream;

util.inherits(ScriptStream, Readable);

function ScriptStream(data) {
  Readable.call(this);

  //this._data = data.split(/\r?\n/);
  this._data = data;
}

ScriptStream.prototype._read = function () {
  var data = this._data;

  //while(this.push(data.shift())) {}

  //if (!data.length) {
    //this.push(null);
  //}
  this.push(data);
  this.push(null);
};

