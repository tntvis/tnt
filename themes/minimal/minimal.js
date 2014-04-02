var epeek_theme_track_minimal = function() {

    var theme = function(gB, div) {
	gB(div);
	// Gene Track1
	var gene_track = epeek.track.track.gene()
	    .height(200)
	    .foreground_color("red")
	    .background_color("#cccccc")
	    .plotter(epeek.track.feature.gene());

	// Gene Track2
	var gene_track2 = epeek.track.track.gene()
	    .height(100)
	    .foreground_color("blue")
	    .background_color("#DDDD00")
	    .plotter(epeek.track.feature.gene());

	// Pin Track1
	var pin_track1 = epeek.track.track.pin()
	    .height(30)
	    .pin_color("blue")
	    .background_color("#cccccc")
	    .plotter(epeek.track.feature.pin());

	var pin1_updater = pin_track1.retriever.local()
	    .retriever(function () {return [
		{
		    pos : 32890000
		},
		{
		    pos : 32896000
		}
	    ]});
	pin_track1.update(pin1_updater);

	// Block Track1
	var block_track = epeek.track.track.block()
	    .height(30)
	    .foreground_color("blue")
	    .background_color("#FFCFDD")
	    .plotter(epeek.track.feature.block());
	var block_updater = block_track.retriever.local()
	    .retriever(function () {return [
		{
		    start : 32890000,
		    end   : 32890500,
		}
	    ]});
	block_track.update(block_updater);

	gB
	    .add_track(gene_track)
	    .add_track(gene_track2)
	    .add_track(pin_track1)
	    .add_track(block_track);

	gB.start();
    };

    return theme;
};
