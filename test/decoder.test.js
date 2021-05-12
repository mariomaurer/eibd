'use strict';

var assert = require('assert'),
    Decoder = require('../lib/decoder.js');

var enc = null;

describe('Decoder', function() {

  before(function() {
    enc = new Decoder();
  });
  describe('Assuming decoder on DPT1', function() {
    it('should decode DPT1 value 1', function() {
      const buf = Buffer.from([65]);
      enc.decode(8, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT1');
        assert.equal(value, 1);
      });
    }),
    it('should decode DPT1 value 0', function() {
      const buf = Buffer.from([64]);
      enc.decode(8, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT1');
        assert.equal(value, 0);
      });
    });
  });

  describe('Assuming decoder on DPT5', function() {
    it('should decode DPT5 value', function() {
      const buf = Buffer.alloc(1);
      buf.writeUInt8(150, 0);
      enc.decode(9, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT5');
        assert.equal(value, 150);
      });
    }),
    it('should throw error if buffer wrong lenght', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(150, 0);
      buf.writeUInt8(151, 1);
      enc.decode(9, buf, function(err) {
        assert.equal(err.message, 'Invalid data len for DPT5');
      });
    });
  });

  describe('Assuming decoder on DPT9', function() {
    it('should decode DPT9 float value - exponent4', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0xA3, 0);
      buf.writeUInt8(0xB5, 1);
      enc.decode(10, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT9');
        assert.equal(Math.round(value * 100) / 100, -175.84);
      });
    });
    
    it('should decode DPT9 float value - exponent4', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0xA5, 0);
      buf.writeUInt8(0x8D, 1);
      enc.decode(10, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT9');
        assert.equal(Math.round(value * 100) / 100, -100.32);
      });
    });
    
    it('should decode DPT9 float value - exponent4', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0xA3, 0);
      buf.writeUInt8(0x21, 1);
      enc.decode(10, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT9');
        assert.equal(Math.round(value * 100) / 100, -199.52);
      });
    });
    
     it('should decode DPT9 float value - exponent6', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0xB6, 0);
      buf.writeUInt8(0xC7, 1);
      enc.decode(10, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT9');
        assert.equal(Math.round(value * 100) / 100, -200.32);
      });
    });
    
    it('should decode DPT9 float value - exponent2', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0x97, 0);
      buf.writeUInt8(0x81, 1);
      enc.decode(10, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'DPT9');
        assert.equal(Math.round(value * 100) / 100, -5.08);
      });
    });
  });
  describe('Assuming decoder on UNKN', function() {
    it('should decode DPT13 32bit integer value', function() {
      const buf = Buffer.alloc(4);
      buf.writeInt32BE(0x6eadbeef, 0);
      enc.decode(12, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'UNKN');
        var decoded = enc.decodeDPT13(value);
        assert.equal(decoded, 0x6eadbeef);
      });
    });
    it('should decode DPT14 float value', function() {
      const buf = Buffer.alloc(4);
      buf.writeUInt8(0x3e, 0);
      buf.writeUInt8(0x9a, 1);
      buf.writeUInt8(0x1c, 2);
      buf.writeUInt8(0xac, 3);
      enc.decode(12, buf, function(err, type, value) {
        assert.equal(err, null);
        assert.equal(type, 'UNKN');
        var decoded = enc.decodeDPT14(value);
        assert.equal(Math.round(decoded * 1000) / 1000, 0.301);
      });
    });
  });
  describe('Assuming decoder should be equal to manual decoder', function() {
    it('DPT1 should be equal', function() {
      const data = Buffer.from([65]);
      let err1,
        type1,
        value1;
      enc.decode(8, data, function(err, type, value) {
        err1 = err;
        type1 = type;
        value1 = value;
      });
      enc.decodeAs('DPT1', data, function(err, type, value) {
        assert.equal(err1, err);
        assert.equal(type1, type);
        assert.equal(value1, value);
      });
    });
    it('DPT5 should be equal', function() {
      const buf = Buffer.alloc(1);
      buf.writeUInt8(150, 0);
      let err1,
        type1,
        value1;
      enc.decode(9, buf, function(err, type, value) {
        err1 = err;
        type1 = type;
        value1 = value;
      });
      enc.decodeAs('DPT5', buf, function(err, type, value) {
        assert.equal(err1, err);
        assert.equal(type1, type);
        assert.equal(value1, value);
      });
    });
    it('DPT9 should be equal', function() {
      const buf = Buffer.alloc(2);
      buf.writeUInt8(0xA3, 0);
      buf.writeUInt8(0xB5, 1);
      let err1,
        type1,
        value1;
      enc.decode(10, buf, function(err, type, value) {
        err1 = err;
        type1 = type;
        value1 = value;
      });
      enc.decodeAs('DPT9', buf, function(err, type, value) {
        assert.equal(err1, err);
        assert.equal(type1, type);
        assert.equal(value1, value);
      });
    });
  });
});
