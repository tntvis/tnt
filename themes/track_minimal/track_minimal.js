var epeek_theme_track_track_minimal = function() {

    var theme = function(gB, div) {
	gB(div);

	gB.limits(function (done) {
	    var lims = {
		right : 1000
	    }
	    done(lims);
	})

	// Block Track1
	var block_track = epeek.track.track.block()
	    .height(30)
	    .foreground_color("blue")
	    .background_color("#FFCFDD")
	    .plotter(epeek.track.feature.block());

	var block_updater = block_track.retriever.local()
	    .retriever(function () {return [
		{
		    start : 20,
		    end   : 100
		}
	    ]});

	block_track.update(block_updater);

	gB.add_track(block_track);

	gB.start();
    };

    return theme;
};
