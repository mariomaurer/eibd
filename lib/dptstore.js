'use strict';

const tools = require('./tools');

/**
 * stores group addresses as keys (String '1/2/4')
 * and its datapoint type as value (Sting 'DPT7')
 */
let store = {};

module.exports = {
    get: function (key) { return store.hasOwnProperty(key) ? store[key] : false },
    set: function (key, val) { store[key] = val; return null },
    fill: function (json) { 
        try {
            store = JSON.parse(json);
            return null;
        }
        catch (err) {
            return err;
        }
    },
    dump: function () { return JSON.stringify(store) }
};
