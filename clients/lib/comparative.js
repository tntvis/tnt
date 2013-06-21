var epeek_theme = function() {
    "use strict";

    // Now, gBs is an array of gBs
    var gBrowserTheme = function(gBs, div) {

	// The controls pane
	var control_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_control_pane");

	var left_button = control_pane
	    .append("button")
	    .on ("click", function() {console.log("left clicked!")});
	left_button
	    .append("img")
	    .attr("src", "glyphicons_216_circle_arrow_left.png");

	var zoomin_button = control_pane
	    .append("button")
	    .on("click", function() {console.log("zoom in clicked!")});
	zoomin_button
	    .append("img")
	    .attr("src", "glyphicons_190_circle_plus.png");

	var zoomout_button = control_pane
	    .append("button")
	    .on("click", function() {console.log("zoom out clicked!")});
	zoomout_button
	    .append("img")
	    .attr("src", "glyphicons_191_circle_minus.png");

	var right_button = control_pane
	    .append("button")
	    .on ("click", function() {console.log("right clicked!")});
	right_button
	    .append("img")
	    .attr("src", "glyphicons_217_circle_arrow_right.png");

	console.log("GBS[0]");
	console.log(gBs[0]);
	gBs[0](div);

    };

    return gBrowserTheme;
}
