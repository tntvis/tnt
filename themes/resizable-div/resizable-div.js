var epeek_theme_track_resizable_div = function() {

    var theme = function(gB, div) {
	var div_theme = d3.select(div);
	div_theme
	    .style("width", (gB.width() + 10) + "px")
	    .style("resize", "both")
	    .style("overflow", "hidden");

	var gene_track = epeek.track.track()
	    .foreground_color('#586471')
	    .height(200)
	    .display(epeek.track.feature.gene())
	    .data(epeek.track.data.gene());

	div_theme.watch("width", function(oldWidth, newWidth) {
	    gB.width(parseInt(newWidth)-15);
	});

	div_theme.watch("height", function(oldHeight, newHeight) {
	    gene_track.height(parseInt(newHeight)-50);
	});


	gB(div);
	gB.add_track(gene_track);
	gB.start();
    };

    return theme;

};