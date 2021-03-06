'use strict';

const tools = require('./tools');

/**
 * Implements encode methods for dpt types
 */
function Encoder() {
}

/**
 * encode dpt 1 values
 */
Encoder.prototype.encodeDPT1 = function(value) {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value & 0x1, 0);
  return buffer;
};

/**
 * encode dpt 2 values
 */
Encoder.prototype.encodeDPT2 = function(value) {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value & 0x3, 0);
  return buffer;
};

/**
 * encode dpt 3 values
 */
Encoder.prototype.encodeDPT3 = function(value) {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value & 0xF, 0);
  return buffer;
};

/**
 * encode dpt 5 values
 */
Encoder.prototype.encodeDPT5 = function(value) {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value & 0xFF, 0);
  return buffer;
};

/**
 * encode dpt 7 values
 */
Encoder.prototype.encodeDPT7 = function(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value & 0xFFFF, 0);
  return buffer;
};

/**
 * encode 9 values
 */
Encoder.prototype.encodeDPT9 = function(value) {

  let data = [0,0];
  // Reverse of the formula: FloatValue = (0,01M)2^E
  let exp = Math.floor(Math.max(Math.log(Math.abs(value)*100)/Math.log(2)-10, 0));
  let mant = value * 100 / (1 << exp);

  //Fill in sign bit
  if(value < 0) {
    data[0] |= 0x80;
    mant = (~(mant * -1) + 1) & 0x07ff;
  }

  //Fill in exp (4bit)
  data[0] |= (exp & 0x0F) << 3;

  //Fill in mant
  data[0] |= (mant >> 8) & 0x7;
  data[1] |= mant & 0xFF;

  const buffer = Buffer.alloc(2);
  buffer.writeUInt8(data[0], 0);
  buffer.writeUInt8(data[1], 1);
  return buffer;
};

/**
 * Encode DTP-10 values. Values is an array [dayOfTheWeek, hour, minutes, seconds]
 *
 * TIME: 10.001 (PDT_TIME).
 *
 * For time:
 * 3 bits for day of week (0 = none; 1 = Monday ; ...; 7 = Sunday)
 * 5 bits for hour (00-23)
 * ---- byte 1
 * 2 bits ZERO as padding
 * 6 bits for minutes (00-59)
 * ---- byte 2
 * 2 bits ZERO as padding
 * 6 bits for seconds (00-59)
 * ---- byte 3
 * 3 octets: N3U5 - r2U6 - r2U6
 */
Encoder.prototype.encodeDPT10 = function(value) {
  const dayOfTheWeek = value[0];
  const hour = value[1];
  const minutes = value[2];
  const seconds = value[3];

  let data = [0,0,0];

  // First byte
  data[0] |= dayOfTheWeek << 5;  // convert the day (mask 3 bits) and shift to left fot 5 bits
  data[0] |= hour & 0x1F; // convert the hour (mask 5 bits)

  // Second byte
  data[1] |= minutes & 0xFF; // convert the hour (mask 6 bits)

  // Third byte
  data[2] |= seconds & 0xFF; // convert the hour (mask 6 bits)

  const buffer = Buffer.alloc(3);
  buffer.writeUInt8(data[0], 0);
  buffer.writeUInt8(data[1], 1);
  buffer.writeUInt8(data[2], 2);
  return buffer;
};

/**
 * Encode DTP-11 values. Values is an array [day, month, year]
 *
 * 000 + Day [1..31]
 * 0000 + Month [1..12]
 * 0 + Year  [0..99]
 * For Dates:
 */
Encoder.prototype.encodeDPT11 = function(value) {

    const day = value[0];
    const month = value[1];
    const year = value[2];

    let data = [0,0,0];

    // First byte
    data[0] |= day;  // convert the day

    // Second byte
    data[1] |= month;

    // Third byte
    data[2] |= year; // convert the hour (mask 6 bits)

    const buffer = Buffer.alloc(3);
    buffer.writeUInt8(data[0], 0);
    buffer.writeUInt8(data[1], 1);
    buffer.writeUInt8(data[2], 2);
    return buffer;
};

/**
 * Encode DTP-14 values. Values is an float
 *

 */
 Encoder.prototype.encodeDPT14 = function(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
};

Encoder.prototype.encode = function(DPTType, value) {
    switch( tools.dpt2MainDPT(DPTType) ) {
        case 'DPT1':
            return this.encodeDPT1(value);
        case 'DPT2':
            return this.encodeDPT2(value);
        case 'DPT3':
            return this.encodeDPT3(value);
        case 'DPT5':
            return this.encodeDPT5(value);
        case 'DPT7':
            return this.encodeDPT7(value);
        case 'DPT9':
            return this.encodeDPT9(value);
        case 'DPT10':
            return this.encodeDPT10(value);
        case 'DPT11':
            return this.encodeDPT11(value);
        case 'DPT14':
            return this.encodeDPT14(value);
        default:
            return undefined;
    }
};

module.exports = Encoder;
