var epeek_theme_track_pins = function() {

    var theme = function(gB, div) {
	// We start the genome browser
	gB(div);

	var gene_track = epeek.genome.track.gene()
	    .height(150)
	    .background_color("#EEEEEE")
	    .foreground_color("green");

	var pin_track1 = epeek.genome.track.pin()
	    .height(30)
	    .background_color("#EEEEEE")
	    .pin_color("blue");

	var pin_track1_updater = pin_track1.retriever.local()
	    .retriever(function () {
		return [
		    { pos : 32900000 },
		    { pos : 32910000 }
		]
	    });
	pin_track1.update(pin_track1_updater);


	var pin_track2 = epeek.genome.track.pin()
	    .height(30)
	    .background_color("#EEEEEE")
	    .pin_color("red");

	var pin_track2_updater = pin_track2.retriever.local()
	    .retriever(function () {
		return [
		    { pos : 32890000 }
		]
	    });
	pin_track2.update(pin_track2_updater);
	

	gB.add_track(gene_track);
	gB.add_track(pin_track1);
	gB.add_track(pin_track2);

	gB.start();

	// We set up a small legend for the pins
	var legend_div = d3.select(div)
	    .append("div")
	    .style("margin-top", "10px");

	var legend_div1 = legend_div
	    .append("div")
	    .style("display", "inline");

	legend_div1
	    .append("img")
	    .attr("src", pin_track1.pin_url())
	    .attr("width", "15");

	legend_div1
	    .append("text")
	    .text("Feature #1");

	var legend_div2 = legend_div
	    .append("div")
	    .style("margin-left", "30px")
	    .style("display", "inline");

	legend_div2
	    .append("img")
	    .attr("src", pin_track2.pin_url())
	    .attr("width", "15");

	legend_div2
	    .append("text")
	    .text("Feature #2");
    };

    return theme;
};
