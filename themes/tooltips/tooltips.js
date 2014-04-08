var epeek_theme_track_tooltips = function() {
    "use strict";

    var theme = function(gB, div) {

	var gene_track = epeek.track.track()
	    .background_color('#EEEEEE')
	    .foreground_color('green')
	    .height(200)
	    .data(epeek.track.data.gene())
	    .display(epeek.track.feature.gene());

	gene_track.display().info(gene_track.display().tooltip());

	gB(div);
	gB.add_track(gene_track);
	gB.start();
    };

    return theme;
};
