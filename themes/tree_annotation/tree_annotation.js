var epeek_theme_tree_tree_annotation = function () {

    var theme = function (div) {

	// The height of tree labels and tracks
	var height = 20;

	// Create tree and annot
	var tree = epeek.tree();
	var annot = epeek.track();

	// Create sub-divs for tree and annot
	var tree_div = d3.select(div)
	    .append("div")
	    .attr("class", "tree_pane");

	var annot_div = d3.select(div)
	    .append("div")
	    .attr("class", "annot_pane");

	// TREE SIDE
	// Configure the tree
	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:\95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;";
	tree
	    .data (epeek.tree.parse_newick (newick))
	    .layout (epeek.tree.layout.vertical()
		     .width(430)
		     .scale(false))
	    .label (epeek.tree.label.text()
		    .height(height));

	// Plot the tree
	tree(tree_div.node());

	// TRACK SIDE
	var leaves = tree.tree().get_all_leaves();

	var tracks = [];
	for (var i=0; i<leaves.length; i++) {
            // Block Track1
	    var block_track = epeek.track.track()
		.height(height)
		.foreground_color("steelblue")
		.background_color("#EBF5FF")
		.data(epeek.track.data()
		      .index("start")
		      .update(
			  epeek.track.retriever.sync()
			      .retriever (function () {
				  return [
				      {
					  start : 233,
					  end   : 260
				      },
				      {
					  start : 350,
					  end   : 423
				      }
				  ]
			      })
		      )
		     )
		.display(epeek.track.feature.block());

	    tracks.push (block_track);
	}

	// We set up the limits for the annotation part
        // annot.limits (function (done) {
        //     var lims = {
        //         right : 1000
        //     }
        //     done(lims);
        // });
	annot.right (1000);

	// An axis track
	var axis = epeek.track.track()
            .height(20)
            .foreground_color("black")
            .background_color("white")
            .display(epeek.track.feature.axis()
                     .orientation("bottom")
                    );


	// We add the tracks
	annot
	    .from(0)
	    .to(1000)
	    .width(300)
	    .add_track(tracks)
	    .add_track(axis);
	annot(annot_div.node());
	annot.start();
    };

    return theme;
};
