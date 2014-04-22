epeek.tree_annot = function () {
"use strict";

    // Defaults
    var tree_conf = {
	tree : undefined,
	track : function (leaf) {
	    var t = epeek.track.track()
		.foreground_color("steelblue")
		.background_color("#EBF5FF")
		.data(epeek.track.data()
		      .index('start')
		      .update(epeek.track.retriever.sync()
			      .retriever (function () {
				  return  []
			      })
			     ))
		.display(epeek.track.feature.block());

	    return t;
	},

	annotation : undefined
    };

    var tree_annot = function (div) {

	var group_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	var tree_div = group_div
	    .append("div")
	    .attr("class", "ePeek_tree_container");

	var annot_div = group_div
	    .append("div")
	    .attr("class", "ePeek_annot_container");

	tree_conf.tree (tree_div.node());

	// tracks
	var leaves = tree_conf.tree.tree().get_all_leaves();
	var tracks = [];

	var height = tree_conf.tree.label().height();

	for (var i=0; i<leaves.length; i++) {
            // Block Track1
	    (function  (leaf) {
		epeek.track.id = function () {
		    return  leaf.id();
		};
	    })(leaves[i])

	    var track = tree_conf.track(leaves[i].data())
		.height(height);

            tracks.push (track);
        }

	// An axis track
	var axis = epeek.track.track()
            .height(height)
            .foreground_color("black")
            .background_color("white")
            .display(epeek.track.feature.axis()
                     .orientation("bottom")
		    );

	tree_conf.annotation
	    .add_track(tracks)
	    .add_track(axis);

	tree_conf.annotation(annot_div.node());
	tree_conf.annotation.start();

	// Override the tree's update method with a new version that also reorder the tracks
	var old_tree_update = tree_conf.tree.update;
	tree_conf.tree.update = function () {
	    old_tree_update();
	    var leaves = tree_conf.tree.tree().get_all_leaves();
	    var ids = [];
	    for (var i=0; i<leaves.length; i++) {
		ids.push(leaves[i].id());
	    }
	    tree_conf.annotation.reorder(ids);
	};

	return tree_annot;
    };

    tree_annot.update = function () {
	tree.update();
    };

    var api = epeek.utils.api (tree_annot)
	.getset (tree_conf);
    
    return tree_annot;
};
