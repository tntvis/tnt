epeek.tree_annot = function () {
"use strict";

    // Defaults
    var tree_conf = {
	tree : undefined,
	track : function (leaf) {
	    var t = epeek.track.track()
		.background_color("#EBF5FF")
		.data(epeek.track.data()
		      .index('start')
		      .update(epeek.track.retriever.sync()
			      .retriever (function () {
				  return  []
			      })
			     ))
		.display(epeek.track.feature.block()
			 .foreground_color("steelblue")
			);

	    return t;
	},
	annotation : undefined,
	ruler : "none",
	key   : undefined
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
		    if (tree_conf.key === undefined) {
			return  leaf.id();
		    }
		    return leaf.property(tree_conf.key);
		};
		var track = tree_conf.track(leaves[i].data())
		    .height(height);

		tracks.push (track);

	    })(leaves[i]);

        }

	// An axis track
	epeek.track.id = function () {
	    return "axis-top";
	};
	var axis_top = epeek.track.track()
	    .height(0)
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	epeek.track.id = function () {
	    return "axis-bottom";
	};
	var axis = epeek.track.track()
            .height(18)
            .background_color("white")
            .display(epeek.track.feature.axis()
                     .orientation("bottom")
		    );

	if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
	    tree_conf.annotation
		.add_track(axis_top);
	}

	tree_conf.annotation
	    .add_track(tracks);

	if (tree_conf.ruler === 'both' || tree_conf.ruler === "bottom") {
	    tree_conf.annotation
		.add_track(axis);
	}

	tree_conf.annotation(annot_div.node());
	tree_conf.annotation.start();

	// Override the tree's update method with a new version that also reorder the tracks
	var prev_tree_update = tree_conf.tree.update;
	tree_conf.tree.update = function () {
	    prev_tree_update();

	    var leaves = tree_conf.tree.tree().get_all_leaves();
	    var new_tracks = [];

	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		new_tracks.push(axis_top);
	    }

	    for (var i=0; i<leaves.length; i++) {
		// We first see if we have a track for the leaf:
		var curr_track = tree_conf.annotation.find_track_by_id(tree_conf.key===undefined ? leaves[i].id() : leaves[i].property(tree_conf.key));
		if (curr_track === undefined) {
		    // New leaf -- no track for it
		    (function (leaf) {
			epeek.track.id = function () {
			    if (tree_conf.key === undefined) {
				return leaf.id();
			    }
			    return leaf.property(tree_conf.key);
			};
			curr_track = tree_conf.track(leaves[i].data())
			    .height(height);
		    })(leaves[i]);
		}
		new_tracks.push(curr_track);
	    }
	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') {
		new_tracks.push(axis);
	    }

	    tree_conf.annotation.reorder(new_tracks);
	};

	return tree_annot;
    };

    var api = epeek.utils.api (tree_annot)
	.getset (tree_conf);
    
    return tree_annot;
};
