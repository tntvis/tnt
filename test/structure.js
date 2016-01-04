var tnt = require ("../index.js");
var assert = require("chai").assert;

describe ("TnT", function () {
    it ("imports correctly", function () {
	assert.isDefined (tnt);
	assert.isFunction (tnt);
    });

    it ("has tnt.utils", function () {
	assert.isDefined (tnt.utils);
	assert.isFunction (tnt.utils);
    });

    it ("has tnt.tree", function () {
	assert.isDefined (tnt.tree);
	assert.isFunction (tnt.tree);
    });

    it ("has tnt.board", function () {
	assert.isDefined (tnt.board);
	assert.isFunction (tnt.board);
    });

    it ("has tnt.tooltip", function () {
	assert.isDefined (tnt.tooltip);
	assert.isFunction (tnt.tooltip);
    });

});
