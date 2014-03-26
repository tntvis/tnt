var epeek_theme_track_resizable_div = function() {

    var theme = function(gB, div) {
	var div_theme = d3.select(div);
	div_theme
	    .style("width", (gB.width() + 10) + "px")
	    .style("resize", "both")
	    .style("overflow", "hidden");

	div_theme.watch("width", function(oldWidth, newWidth) {
	    gB.width(parseInt(newWidth)-15);
	});

	div_theme.watch("height", function(oldHeight, newHeight) {
	    gB.height(parseInt(newHeight)-50);
	});


	gB(div);
	gB.start();
    };

    return theme;

};