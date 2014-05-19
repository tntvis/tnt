var tnt_theme_track_track_minimal = function() {

    var theme = function(gB, div) {
	gB(div);

	gB.right (1000);

	// Block Track1
	var block_track = tnt.track.track()
	    .height(30)
	    .background_color("#FFCFDD")
	    .data(tnt.track.data()
		  .update(
		      tnt.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      start : 20,
				      end   : 100
				  }
			      ]
			  })
		  )
		 )
	    .display(tnt.track.feature.block()
		     .foreground_color("blue")
		     .index(function (d) {
			 return d.start;
		     }));

	// Axis Track1
	var axis_track = tnt.track.track()
	    .height(30)
	    .background_color("white")
	    .display(tnt.track.feature.axis()
		     .orientation("top")
		    );

	// Location Track1
	var loc_track = tnt.track.track()
	    .height(30)
	    .background_color("white")
	    .display(tnt.track.feature.location());

	gB
	    .add_track(loc_track)
	    .add_track(axis_track)
	    .add_track(block_track);

	gB.start();
    };

    return theme;
};
