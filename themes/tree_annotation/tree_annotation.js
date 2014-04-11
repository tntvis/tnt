var epeek_theme_tree_tree_annotation = function() {

    var theme = function(div) {

	// Create tree and annot
	var tree = epeek.tree();
	var annot = epeek.track();

	// configure the tree
	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:\
95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;";
	tree
	    .data(epeek.tree.parse_newick(newick))
	    .layout(epeek.tree.layout.vertical().width(500).scale(false))
	    .label(epeek.tree.label.text().height(20));

	tree(div);

	// Gene Track1
	var gene_track = epeek.track.track()
	    .foreground_color("red")
	    .background_color("#cccccc")
	    .height(200)
	    .data(epeek.track.data.gene())
	    .display(epeek.track.feature.gene());

	// Gene Track2
	var gene_track2 = epeek.track.track()
	    .height(100)
	    .foreground_color("blue")
	    .background_color("#DDDD00")
	    .data(epeek.track.data.gene())
	    .display(epeek.track.feature.gene());

	// Pin Track1
	var pin_track1 = epeek.track.track()
	    .height(30)
	    .background_color("#cccccc")
	    .data(epeek.track.data()
		  .index("pos")
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      pos : 32890000
				  },
				  {
				      pos : 32896000
				  }
			      ]
			  })
		  )
		 )
	    .display(epeek.track.feature.pin()
		     .pin_color("blue"));

	// Block Track1
	var block_track = epeek.track.track()
	    .height(30)
	    .foreground_color("blue")
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      start : 32890000,
				      end   : 32890500
				  }
			      ]
			  })
		  )
		 )
	    .display(epeek.track.feature.block());

	// We add the tracks
	// gB
	//     .add_track(gene_track)
	//     .add_track(gene_track2)
	//     .add_track(pin_track1)
	//     .add_track(block_track);

	// gB.start();
    };

    return theme;
};
