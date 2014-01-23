var epeek_theme = function() {

    var theme = function(gB, div) {
	// We put several pins
	var pin1_url = gB.pin([32900000, 32910000]);
        var pin2_url = gB.pin([32890000]);
// 	var pin3_url = gB.pin([32880000]);
// 	var pin4_url = gB.pin([32870000]);
// 	var pin5_url = gB.pin([32860000]);
// 	var pin6_url = gB.pin([32850000]);

	// We start the genome browser
	gB(div);
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
	    .attr("src", pin1_url)
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
	    .attr("src", pin2_url)
	    .attr("width", "15");

	legend_div2
	    .append("text")
	    .text("Feature #2");
    };

    return theme;
};
