var epeek_theme_track_pins = function() {

    var theme = function(gB, div) {
	// We start the genome browser
	gB(div);

	var gene_track = epeek.track.track()
	    .height(150)
	    .background_color("#EEEEEE")
	    .foreground_color("green")
	    .display(epeek.track.feature.gene())
	    .data(epeek.track.data.gene());

	var pin_track1 = epeek.track.track()
	    .height(30)
	    .background_color("#EEEEEE")
	    .display(epeek.track.feature.pin()
		     .pin_color("blue"));

	var pin_track1_updater = epeek.track.data()
	    .index("pos")
	    .update (epeek.track.retriever.sync()
		     .retriever(function () {
			 return [
			     { pos : 32900000 },
			     { pos : 32910000 }
			 ]
		     })
		    );
	pin_track1.data(pin_track1_updater);


	var pin_track2 = epeek.track.track()
	    .height(30)
	    .background_color("#EEEEEE")
	    .display(epeek.track.feature.pin()
		     .pin_color("red"))

	var pin_track2_updater = epeek.track.data()
	    .index("pos")
	    .update (epeek.track.retriever.sync()
		     .retriever(function () {
			 return [
			     { pos : 32890000 }
			 ]
		     })
		    );
	pin_track2.data(pin_track2_updater);
	

	gB
	    .add_track(gene_track)
	    .add_track(pin_track1)
	    .add_track(pin_track2);

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
	    .attr("src", pin_track1.display().pin_url())
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
	    .attr("src", pin_track2.display().pin_url())
	    .attr("width", "15");

	legend_div2
	    .append("text")
	    .text("Feature #2");
    };

    return theme;
};
