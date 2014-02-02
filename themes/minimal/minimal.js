var epeek_theme = function() {

    var theme = function(gB, div) {
	gB(div);
	var gene_track = epeek.genome.track.gene()
	    .height(200)
	    .foreground_color("red")
	    .background_color("#cccccc");

	var gene_track2 = epeek.genome.track.gene()
	    .height(100)
	    .foreground_color("blue")
	    .background_color("#DDDD00");

	var pin_track1 = epeek.genome.track.pin()
	    .height(30)
	    .pin_color("blue")
	    .background_color("#cccccc");

	var pin1_updater = pin_track1.retriever.local()
	    .retriever(function(){return [
		{
		    pos : 32890000,
		}
	    ]});

	pin_track1.update(pin1_updater);

	gB.add_track(gene_track);
	gB.add_track(gene_track2);
	gB.add_track(pin_track1);

	gB.start();
    };

    return theme;
};
