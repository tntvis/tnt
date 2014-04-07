var epeek_theme_track_local_data = function() {

    var theme = function(gB, div) {
	gB(div);

	var fg_color = "#1873CC";
	var bg_color = "#D1E3F5";

	gB.limits (function (done) {
	    var lims = {
		right : 1000
	    }
	    done(lims);
	});

	var axis = epeek.track.track()
	    .height(30)
	    .foreground_color("black")
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	// Location Track1
	var location = epeek.track.track()
	    .height(30)
	    .foreground_color("black")
	    .background_color("white")
	    .display(epeek.track.feature.location());

	// Block Track1
	var block_track1 = epeek.track.track()
	    .height(20)
	    .foreground_color(fg_color)
	    .background_color(bg_color)
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.async()
			  .url('/themes/local_data/track1.json')
		  )
		 )
	    .display(epeek.track.feature.block());

	// Block Track2
	var block_track2 = epeek.track.track()
	    .height(20)
	    .foreground_color(fg_color)
	    .background_color(bg_color)
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.async()
			  .url('/themes/local_data/track2.json')
		  )
		 )
	    .display(epeek.track.feature.block());

	// Block Track3
	var block_track3 = epeek.track.track()
	    .height(20)
	    .foreground_color(fg_color)
	    .background_color(bg_color)
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.async()
			  .url('/themes/local_data/track3.json')
		  )
		 )
	    .display(epeek.track.feature.block());

	// Block Track4
	var block_track4 = epeek.track.track()
	    .height(20)
	    .foreground_color(fg_color)
	    .background_color(bg_color)
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.async()
			  .url('/themes/local_data/track4.json')
		  )
		 )
	    .display(epeek.track.feature.block());

	// Block Track5
	var block_track5 = epeek.track.track()
	    .height(20)
	    .foreground_color(fg_color)
	    .background_color(bg_color)
	    .data(epeek.track.data()
		  .index("start")
		  .update(
		      epeek.track.retriever.async()
			  .url('/themes/local_data/track5.json')
		  )
		 )
	    .display(epeek.track.feature.block());

	// We add the tracks
	gB
	    .add_track(location)
	    .add_track(axis)
	    .add_track(block_track1)
	    .add_track(block_track2)
	    .add_track(block_track3)
	    .add_track(block_track4)
	    .add_track(block_track5);

	gB.start();
    };

    return theme;
};
