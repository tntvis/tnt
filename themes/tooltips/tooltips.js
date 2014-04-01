var epeek_theme_track_tooltips = function() {
    "use strict";

    var theme = function(gB, div) {

	var gene_track = epeek.genome.track.gene()
	    .background_color('#EEEEEE')
	    .foreground_color('green')
	    .height(200)
	    .plotter(epeek.genome.feature.gene());

	gene_track.info_callback(gene_track.tooltip());

	gB(div);
	gB.add_track(gene_track);
	gB.start();
    };

    return theme;
};
