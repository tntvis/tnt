var epeek_theme = function() {
    "use strict";

    var theme = function(gB, div) {
	gB.gene_info_callback = gB.tooltip(); // gene info callback

	gB(div);

	gB.start();
    };

    return theme;
};
