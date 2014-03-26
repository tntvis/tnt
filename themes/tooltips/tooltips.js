var epeek_theme_track_tooltips = function() {
    "use strict";

    var theme = function(gB, div) {
	var tooltip = epeek.tooltip()
	    .type("table");

	gB.gene_info_callback = gB.tooltip(tooltip); // gene info callback

	gB(div);

	gB.start();
    };

    return theme;
};
