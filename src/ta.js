var apijs = require("tnt.api");
var defer_cancel = require("tnt.utils").defer_cancel;

var ta = function () {
    "use strict";

    var dispatch = d3.dispatch ("drag");

    var no_track = true;
    var div_id;

    // Defaults
    var tree_conf = {
        tree: undefined,
        track: function () {
            var t = tnt.board.track()
                .color("#EBF5FF")
                .data(tnt.board.track.data()
                    .update(tnt.board.track.retriever.sync()
                        .retriever(function () {
                            return [];
                        })
                    ))
                .display(tnt.board.track.feature.block()
                    .color("steelblue")
                    .index(function (d) {
                        return d.start;
                    })
                );

            return t;
        },
        board: undefined,
        top: undefined,
        bottom: undefined,
        key: undefined,
    };

    var tree_annot = function (div) {
        div_id = d3.select(div)
            .attr("id");

        var group_div = d3.select(div)
            .append("div")
            .attr("class", "tnt_groupDiv");

        var tree_div = group_div
            .append("div")
            .attr("id", "tnt_tree_container_" + div_id)
            .attr("class", "tnt_tree_container");

        var annot_div = group_div
            .append("div")
            .attr("id", "tnt_annot_container_" + div_id)
            .attr("class", "tnt_annot_container");

        var curr_tree_width = tree_conf.tree.layout().width();
        var drag = group_div
            .append("div")
            .attr("id", "tnt_annot_drag")
            .style("left", curr_tree_width + "px");

        // Dragging
        drag.on("mousedown", function () {
            var resizing_pos = d3.event.clientX;
            curr_tree_width = tree_conf.tree.layout().width();
            var curr_board_width = tree_conf.board.width();

            var deferred = defer_cancel(function mousemove(clientX) {
                var current_pos = clientX;
                var diff = current_pos - resizing_pos;
                // var curr_tree_width = tree_conf.tree.layout().width();
                tree_conf.tree.layout().width(curr_tree_width + diff);

                // var curr_board_width = tree_conf.board.width();
                tree_conf.board.width(curr_board_width - diff);

                tree_conf.tree.update();
                tree_conf.board.update();
                resizing_pos = current_pos;
                dispatch.drag.call(this);
            }, 300);

            var w = d3.select(window)
                .on("mousemove", function () {
                    deferred(d3.event.clientX);
                    var curr_tree_width = tree_conf.tree.layout().width();
                    var diff = d3.event.clientX - resizing_pos;
                    drag.style("left", (curr_tree_width + diff) + "px");
                })
                .on("mouseup", mouseup);

            function mouseup() {
                // TODO: Does this remove other listeners on the window?
                w.on("mousemove", null).on("mouseup", null);
            }
        });

        tree_conf.tree(tree_div.node());

        // tracks
        var leaves = tree_conf.tree.root().get_all_leaves();
        var tracks = [];

        var height = tree_conf.tree.label().height();

        for (var i = 0; i < leaves.length; i++) {
            // Block Track1
            (function (leaf) {
                tnt.board.track.id = function () {
                    if (tree_conf.key === undefined) {
                        return leaf.id();
                    }
                    if (typeof (tree_conf.key) === 'function') {
                        return tree_conf.key(leaf);
                    }
                    return leaf.property(tree_conf.key);
                };
                var track = tree_conf.track(leaves[i])
                    .height(height);

                tracks.push(track);
            })(leaves[i]);
        }

        if (tree_conf.board) {
            if (tree_conf.top) {
                tree_conf.board
                    .add_track(tree_conf.top);
            }

            tree_conf.board
                .add_track(tracks);

            if (tree_conf.bottom) {
                tree_conf.board
                    .add_track(tree_conf.bottom);
            }

            tree_conf.board(annot_div.node());
            tree_conf.board.start();
        }

        api.method('update', function () {
            tree_conf.tree.update();

            if (tree_conf.board) {
                var leaves = tree_conf.tree.root().get_all_leaves();
                var new_tracks = [];

                if (tree_conf.top) {
                    console.log('top height is...');
                    console.log(tree_conf.top.height());
                    new_tracks.push(tree_conf.top);
                }

                for (var i = 0; i < leaves.length; i++) {
                    // We first see if we have a track for the leaf:
                    var id;
                    if (tree_conf.key === undefined) {
                        id = leaves[i].id();
                    } else if (typeof (tree_conf.key) === 'function') {
                        id = tree_conf.key(leaves[i]);
                    } else {
                        id = leaves[i].property(tree_conf.key);
                    }
                    var curr_track = tree_conf.board.find_track(id);
                    if (curr_track === undefined) {
                        // New leaf -- no track for it
                        (function (leaf) {
                            tnt.board.track.id = function () {
                                if (tree_conf.key === undefined) {
                                    return leaf.id();
                                }
                                if (typeof (tree_conf.key) === 'function') {
                                    return tree_conf.key(leaf);
                                }
                                return leaf.property(tree_conf.key);
                            };
                            curr_track = tree_conf.track(leaves[i])
                                .height(height);
                        })(leaves[i]);
                    }
                    new_tracks.push(curr_track);
                }
                if (tree_conf.bottom) {
                    new_tracks.push(tree_conf.bottom);
                }

                tree_conf.board.tracks(new_tracks);
            }
        });

        return tree_annot;
    };

    var api = apijs(tree_annot)
        .getset(tree_conf);

    // TODO: Rewrite with the api interface
    tree_annot.track = function (new_track) {
        if (!arguments.length) {
            return tree_conf.track;
        }

        // First time it is set
        if (no_track) {
            tree_conf.track = new_track;
            no_track = false;
            return tree_annot;
        }

        // If it is reset -- apply the changes
        var tracks = tree_conf.board.tracks();

        var start_index = 0;
        var n_index = 0;

        if (tree_conf.top && tree_conf.bottom) {
            start_index = 1;
            n_index = 2;
        } else if (tree_conf.top) {
            start_index = 1;
            n_index = 1;
        } else if (tree_conf.bottom) {
            n_index = 1;
        }

        // Reset top track -- axis
        if (start_index > 0) {
            tracks[0].display().reset.call(tracks[0]);
        }
        // Reset bottom track -- axis
        if (n_index > start_index) {
            var n = tracks.length - 1;
            tracks[n].display().reset.call(tracks[n]);
        }

        for (var i = start_index; i <= (tracks.length - n_index); i++) {
            var t = tracks[i];
            t.display().reset.call(t);
            var leaf;
            tree_conf.tree.root().apply(function (node) {
                if (node.id() === t.id()) {
                    leaf = node;
                }
            });

            var n_track;
            (function (leaf) {
                tnt.board.track.id = function () {
                    if (tree_conf.key === undefined) {
                        return leaf.id();
                    }
                    if (typeof (tree_conf.key === 'function')) {
                        return tree_conf.key(leaf);
                    }
                    return leaf.property(tree_conf.key);
                };
                n_track = new_track(leaf)
                    .height(tree_conf.tree.label().height());
            })(leaf);

            tracks[i] = n_track;
        }

        tree_conf.track = new_track;
        tree_conf.board.start();
    };

    // return tree_annot;
    return d3.rebind (tree_annot, dispatch, "on");
};

module.exports = exports = ta;
