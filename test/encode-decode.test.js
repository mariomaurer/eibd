'use strict';

let assert = require('assert'),
    Encoder = require('../lib/encoder.js'),
    Decoder = require('../lib/decoder.js');

let enc = null;
let dec = null;

describe('Encode-Decode-Loop', function() {

  before(function() {
    enc = new Encoder();
    dec = new Decoder();
  });
  describe('Encode values and decode it with given DPT', function() {
    //TODO: DTP 2,3,4,5,6,8,10,11,12,232
    let tests = [
        {type: 'DPT7', value: 31247}
    ]
    tests.forEach(function(test) {
        it('should encode ' + test.type + ' value and decode it again', function() {
            const buf = Buffer.from(enc.encode(test.type, test.value));
            dec.decodeAs(test.type, buf, function(err, type, value) {
                assert.equal(err, null);
                assert.equal(test.value, value);
            });
        });
    });
  });
});
