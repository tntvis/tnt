var epeek_theme_track_sequence_track = function() {

    var theme = function(gB, div) {
	gB(div);

	gB.right (1000);

	var seq_info = (function (seq) {
	    var k = [];
	    for (var i=0; i<seq.length; i++) {
		 k.push ({
		     pos : i+1,
		     nt  : seq[i]
		});
	    }
	    return k;
	})(seq);

	// Block Track1
	var sequence_track = epeek.track.track()
	    .height(30)
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return seq_info;
			  })
		  )
		 )
	    .display(epeek.track.feature.sequence()
		     .foreground_color("black")
		     .sequence(function (d) {
			 return d.nt;
		     })
		     .index(function (d) {
			 return d.pos;
		     }));

	// Axis Track1
	var axis_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	// Location Track1
	var loc_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.location());

	gB
	    .right (seq.length)
	    .from (0)
	    .to(50)
	    .zoom_out(100)
	    .zoom_in(50)
	    .add_track(loc_track)
	    .add_track(axis_track)
	    .add_track(sequence_track);

	gB.start();
    };

    return theme;
};

var seq = 'ACCGTGAGAGCCCCTTTGGCGGAGCGAGCATTATTACGCGCGAATCTAGCATGCTAGGCGCGATTTATCCTGCGCGCGCAGATATTCTCTCGCGCGAGACGTACGATCGGCGCGATCGATGCTAGCCGGCGCTAGCTAGTCGAGCGCGCTAGTCGATGCCGGCGCGCATATATATTAGCGCGATCGATCGATGCTAGTACGTAGCTGCGCGCGCGATAATTATTATCGCGCGCGAGCGTACGATGCTACGTGCGCGCGCGCGAGATTATATTATTTATTTATATATTCCTTCTCGCGCGCGCGGAGGATATTTATCGATCGATCGTAGCTAGCTAGCTAGCTAGCTGATCATGCTAGCTAGCTAGCTAGCTACGTAGTCAGCTGTCAGATGCTAGCTAGCTAGTAGCTAGCTAGTCGATCGTAGCTAGCTCGTAGCTATATATCTCTCTCTCTCATGAGGATCGTAGCTCGTAGGAGAGTAGCTCGTAGCTAGCTACGTAGCATGCTAGCTAGCACGTATGCTAGCTGAGTCGCCGCATTATACTGAAATATTATTCGCGATCGGCGCATTCACGATCGATGCAGCCGCGCGGCGGCGGCGCGCGATATATTCGGC';
