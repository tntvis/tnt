var epeek_theme_track_line_track = function() {

    var theme = function(t, div) {
	t(div);

	t.right (1000);

	// Axis Track1
	var axis_track = epeek.track.track()
	    .height(20)
	    .foreground_color("black")
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	// Bezier line track
	var line_track = epeek.track.track()
	    .height(40)
	    .foreground_color("blue")
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .index("pos")
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      pos : 20,
				      val : 10
				  },
				  {
				      pos : 100,
				      val : 60
				  },
				  {
				      pos : 500,
				      val : 20
				  }
			      ]
			  })
		  )
		 )
	    .display(epeek.track.feature.bezier()
		     .limits ([0,100])
		    );

	t
	    .add_track(axis_track)
	    .add_track(line_track);

	t.start();
    };

    return theme;
};
