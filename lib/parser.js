'use strict';

var Readable = require('stream').Readable,
    Decoder = require('./decoder'),
    tools = require('./tools');
const dtpStore = require('./dptstore');

/**
 * Parser
 */
function Parser(socket, options) {

  if(!(this instanceof Parser)) {
    return new Parser(options);
  }

  Readable.call(this, options);

  this.decoder = new Decoder();
  this._source = socket;
  this._inputBuffer = new Buffer.alloc(0);
  
  var self = this;
  // hit source end
  this._source.on('end', function() {

  });

  // get data
  this._source.on('data', function(data) {
    self.onData(data);
  });

}

Parser.prototype = Object.create(
      Readable.prototype, { constructor: { value: Parser }});

/**
 * parse telegram
 */
Parser.prototype.parseTelegram = function(telegram) {
  let self = this;
  const len = telegram.readUInt8(1);
  // 4 + 5 src adr.
  const src = telegram.readUInt16BE(4);
  const srcPA = tools.addr2str(src, false);
  // 6 + 7 dest adr.
  const dest = telegram.readUInt16BE(6);
  const destGA = tools.addr2str(dest, true);
  // action (TPCI)
  const action = telegram.readUInt8(9);

  let event = '';
  switch(action)  {
    case 129:
      event = 'write';
      break;
    case 128:
      event = 'write';
      break;
    case 65:
      event = 'response';
      break;
    case 64:
      event = 'response';
      break;
    case 0:
      event = 'read';
      break;
  }
  
  if(action > 0) {
    // Write or Response event
    const val = (len <= 8) ? telegram.slice(-1) : telegram.slice(10);

    let emitNewValue = function(err, type, value) {
      // emit raw telegram event, pass the addresses and the buffer, no DPT guessing, copy of data buffer
      self.emit('telegram', event, srcPA, destGA, val);
      // emit action event
      self.emit(event, srcPA, destGA, type, value);
      // emit dest address event
      self.emit(destGA, event, srcPA, destGA, type, value);
    };

    let dpType = dtpStore.get(destGA);
    if (dpType) {
      // groupaddress is in dptstore
      //console.log('type found: ' + type + ' of length: ' + len);
      self.decoder.decodeAs(dpType, val, emitNewValue);
    } else {
      // groupaddress is not in dptstore
      //console.log('type not found: ' + type + ' of length: ' + len);
      self.decoder.decode(len, val, emitNewValue);
      };

  } else {
    // Read event
    // emit action event
    self.emit(event, srcPA, destGA);
    // emit dest address event
    self.emit(destGA, event, srcPA, destGA);  
  }
  
};

/**
 * data received from socket
 */
Parser.prototype.onData = function(chunk) {
  // no data received
  if(chunk === null) {
    return ;
  }
    
  // store chunk
  this._inputBuffer = Buffer.concat([this._inputBuffer, chunk]);
    
  while (true) {
    // check if at least length header is here
    if (this._inputBuffer.length < 2) {
      return;
    }

    var packetlen = this._inputBuffer[1] + 2;
    if (packetlen > this._inputBuffer.length) {
      //not enough data
      return;
    }

    //what kind of packet have we got...
    if (packetlen === 4) {
      //confirm mag
    } else if (packetlen === 5) {
      //opengroupsocket
    } else if (packetlen >= 6) {
      // we have at least one complete package
      var telegram = this._inputBuffer.slice(0, packetlen);
      // emit event
      this.parseTelegram(telegram);
    }
    this._inputBuffer = this._inputBuffer.slice(packetlen);
  }
};

module.exports = Parser;
