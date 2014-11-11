var tnt_theme_track_track_minimal = function() {

    var theme = function(board, div) {
	board(div);

	board
	    .right (300)
	    .zoom_out (300)
	    .from(0)
	    .to(50)

	// Block Track1
	var block_track = tnt.track()
	    .height(50)
	    .background_color("#FFCFDD")
	    .foreground_color("blue")
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
		     .index(function (d) {
			 return d.start;
		     }));

	// Axis Track1
	board
	    .axis(true)
	// var axis_track = tnt.track()
	//     .height(30)
	//     .background_color("white")
	//     .display(tnt.track.feature.axis()
	// 	     .orientation("top")
	// 	    );

	// Location Track1
	// var loc_track = tnt.track()
	//     .height(30)
	//     .background_color("white")
	//     .display(tnt.track.feature.location());

	board
//	    .add_track(loc_track)
//	    .add_track(axis_track)
	    .add_track(block_track);

	board.start();
    };

    return theme;
};
