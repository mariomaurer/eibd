'use strict';

/**
 * Implements decode methods for dpt types
 */
function Decoder() {
}

/**
 * decode dpt 1 values
 */
Decoder.prototype.decodeDPT1 = function(buffer) {
  let value = buffer.readUInt8(0)-64;
  if(value > 1) {
    value = value-64;
  };
  return value;
};

/**
 * decode eis 8 / dpt 2 values
 */
Decoder.prototype.decodeDPT2 = function(buffer) {
  return buffer & 0x3;
};

/**
 * decode eis 2 / dpt 3 values
 */
Decoder.prototype.decodeDPT3 = function(buffer) {
  return buffer.readUInt8(0) & 0xf;
};

/**
 * decode eis 13 / dpt 4 values
 */
Decoder.prototype.decodeDPT4 = function(buffer) {
  var value = buffer.readUInt8(0);
  if(value <= 127) {
    value = buffer.toString('ascii', 0);
  } else {
    value = buffer.toString('utf8', 0);
  }
  return value;
};

/**
 * decode eis 14 / dpt 5 values
 */
Decoder.prototype.decodeDPT5 = function(buffer) {
  return buffer.readUInt8(0);
};

/**
 * decode eis 14 / dpt 6 values
 */
Decoder.prototype.decodeDPT6 = function(buffer) {
  return buffer.readInt8(0);
};

/**
 * decode EIS 10 / dpt 7 values
 */
Decoder.prototype.decodeDPT7 = function(buffer) {
  return buffer.readUInt16BE(0);
};

/**
 * decode EIS 10.001 / dpt 8 values
 */
Decoder.prototype.decodeDPT8 = function(buffer) {
  return buffer.readInt16BE(0);
};

/**
 * Decode eis 5 / dpt 9 values.
 * From the specs: FloatValue = (0,01M)2^E
 * - E = 0,15
 * - M = -2048,2047
 */
Decoder.prototype.decodeDPT9 = function(buffer) {
  var value = buffer.readUInt16BE(0);

  var sign = (value & 0x8000) >> 15;
  var exp = (value & 0x7800) >> 11;
  var mant = (value & 0x07ff);

  if(sign !== 0) {
    mant = -(~(mant - 1) & 0x07ff);
  }
  return 0.01 * mant * Math.pow(2,exp);
};

/**
 * decode eis 3 / dpt 10 values
 */
Decoder.prototype.decodeDPT10 = function(buffer) {

  var value = new Date();

  var weekDay = (buffer[0] & 0xe0) >> 5;
  var hour = buffer[0] & 0x1f;
  var min = buffer[1] & 0x3f;
  var sec = buffer[2] & 0x3f;

  value.setHours(hour);
  value.setMinutes(min);
  value.setSecondes(sec);
  var currentDay = value.getDay();
  if(currentDay !== weekDay) {
    if(currentDay > weekDay) {
      value.setDate(value.getDate() + (weekDay - currentDay));
    } else {
      value.setDate(value.getDate() - (weekDay - currentDay));
    }
  }
  return value;
};

/**
 * decode eis 4 / dpt 11 values
 */
Decoder.prototype.decodeDPT11 = function(buffer) {
  const day = buffer[0] & 0x1f;
  const mon = buffer[1] & 0xf;
  let year = buffer[2] & 0x7f;

  if(year < 90) {
    year += 2000;
  } else {
    year += 1900;
  }

  return new Date(year, mon, day);
};

/**
 * decode eis 11 / dpt 12 values
 */
Decoder.prototype.decodeDPT12 = function(buffer) {
  return buffer.readUInt32BE(0);
};

/**
 * decode eis 11.001 / dpt 13 values
 */
Decoder.prototype.decodeDPT13 = function(buffer) {
  return buffer.readInt32BE(0);
};

/**
 * decode eis 9 / dpt 14 values
 */
Decoder.prototype.decodeDPT14 = function(buffer) {
  return buffer.readFloatBE(0);
};

Decoder.prototype.decodeDPT16 = function(buffer) {
  let value = "";
  for(let i = 0; i < buffer.length; i++) {
    value += String.fromCharCode(buffer.readUInt8(i));
  }
  return value;
};

Decoder.prototype.decodeDPT232 = function(buffer) {
  //[red, green, blue]
  return [buffer[2], buffer[1], buffer[0]]
};

/**
 * decode value
 */
Decoder.prototype.decode = function(len, data, callback) {

  var err = null;
  var type = 'UNKN';
  var value = null;

  // eis 1 / dpt 1.xxx
  if(len === 8) {
    type = 'DPT1';
    value = this.decodeDPT1(data);
  }

  // eis 6 / dpt 5.xxx
  // assumption
  if(len === 9){
    type = 'DPT5';
    if(data.length === 1) {
      value = this.decodeDPT5(data);
    } else {
      err = new Error('Invalid data len for DPT5');
    }
  }

  // eis 5 / dpt 9.xxx
  // assumption
  if(len === 10) {
    type = 'DPT9';
    if(data.length === 2) {
      value = this.decodeDPT9(data);
    }
    else {
      err = new Error('Invalid data len for DPT9');
    }
  }

  //If still unkown take the raw Buffer
  if(type === 'UNKN') {
    type = 'DPT14';
    value = this.decodeDPT14(data);
  }

  if(callback) {
      callback(err, type, value);
  }
};

/**
 * decode value for given DPT
 * mainDPT is only main type without dot (eg. 'DPT7') 
 * data is expected to be a Buffer
 */
Decoder.prototype.decodeAs = function(mainDPT, data, callback) {
  const len = data.length;
  let self = this;
  let value = null;
  let err = null;

  let {decoder: decodeDPT, size: dptSize} = (function(dpt){
    switch(dpt) {
      // size in byte
      case 'DPT1':
        return {decoder: self.decodeDPT1, size: 1};
      case 'DPT2':
        return {decoder: self.decodeDPT2, size: 1};
      case 'DPT3':
        return {decoder: self.decodeDPT3, size: 1};
      case 'DPT4':
        return {decoder: self.decodeDPT4, size: 1};
      case 'DPT5':
        return {decoder: self.decodeDPT5, size: 1};
      case 'DPT6':
        return {decoder: self.decodeDPT6, size: 1};
      case 'DPT7':
        return {decoder: self.decodeDPT7, size: 2};
      case 'DPT8':
        return {decoder: self.decodeDPT8, size: 2};
      case 'DPT9':
        return {decoder: self.decodeDPT9, size: 2};
      case 'DPT10':
        return {decoder: self.decodeDPT10, size: 3};
      case 'DPT11':
        return {decoder: self.decodeDPT11, size: 3};
      case 'DPT12':
        return {decoder: self.decodeDPT12, size: 4};
      case 'DPT13':
        return {decoder: self.decodeDPT13, size: 4};
      case 'DPT14':
        return {decoder: self.decodeDPT14, size: 4};
      case 'DPT16':
        return {decoder: self.decodeDPT16, size: 14};
      case 'DPT232':
        return {decoder: self.decodeDPT232, size: 3};
      default:
        return {decoder: null, size: null};
    };
  })(mainDPT);

  if(len === dptSize) {
    value = decodeDPT(data);
  } else if(decodeDPT === null) {
    err = new Error('Unknown DPT declaration: ' + dpType);
  } else {
    err = new Error('Mismatching DPT declaration and data length');
  }

  if(callback){
    callback(err, mainDPT, value);
  }
};

module.exports = Decoder;
