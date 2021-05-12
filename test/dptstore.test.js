'use strict';

let assert = require('assert'),
    store = require('../lib/dptstore.js');

describe('DPT Store', function() {

    it('should fill from json string', function() {
        const items = `{
            "1/1/1": "DPT1",
            "1/2/2": "DPT2",
            "1/3/3": "DPT3", 
            "1/4/4": "DPT4",
            "1/5/5": "DPT5", 
            "1/6/6": "DPT6"
            }`;
        let err = store.fill(items);
        //remove whitespace
        let test = items.replace(/\s/g, "");
        
        assert.equal(err, null);
        assert.equal(test, store.dump());
    }),
    it('should "get" a DPT for a GA String', function() {
        assert.equal(store.get('1/2/2'), 'DPT2');
    }),
    it('should add a value with "set"', function() {
        assert.equal(store.get('1/7/7'), false);
        store.set('1/7/7', 'DPT7');
        assert.equal(store.get('1/7/7'), 'DPT7');
    })
});
