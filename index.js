if (typeof tnt === "undefined") {
    module.exports = tnt = require("./src/ta.js");
}
var eventsystem = require ("biojs-events");
eventsystem.mixin (tnt);
tnt.utils = require ("tnt.utils");
tnt.tooltip = require ("tnt.tooltip");
tnt.tree = require ("tnt.tree");
tnt.tree.node = require ("tnt.tree.node");
tnt.board = require ("tnt.board");
tnt.board.genome = require("tnt.genome");
//tnt.legend = require ("tnt.legend");
