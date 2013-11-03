var epeek_theme = function() {
    "use strict";

    var theme = function(gB, div) {
	gB.gene_info_callback = epeek.tooltip()
	    .background_color(gB.background_color())
	    .foreground_color(gB.foreground_color()); //gene_info_callback;
	
	gB(div);

	gB.startOnOrigin();
    };

    return theme;
};
