var epeek_theme = function() {
    "use strict";

    // Now, gBs is an array of gBs
    var gBrowserTheme = function(gBs, div) {

	// The controls pane
	// TODO: The style elements should be included in a CSS file should we have a separate stylesheet for this theme
	var control_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_control_pane")
	    .style("margin-left", "auto")
	    .style("margin-right", "auto")
	    .style("width", "50%");

	var left_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].left(1.2);
		}});
	left_button
	    .append("img")
	    .attr("src", "glyphicons_216_circle_arrow_left.png");

	var zoomin_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(0.8);
		}
	    });
	zoomin_button
	    .append("img")
	    .attr("src", "glyphicons_190_circle_plus.png");

	var zoomout_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(1.2);
		}
	    });
	zoomout_button
	    .append("img")
	    .attr("src", "glyphicons_191_circle_minus.png");

	var right_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].right(1.2);
		}
	    });
	right_button
	    .append("img")
	    .attr("src", "glyphicons_217_circle_arrow_right.png");

	var origin_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].startOnOrigin();
		}
	    });
	origin_button
	    .append("img")
	    .attr("src", "glyphicons_242_google_maps.png");

	var setupDiv = function (i) {
	    setTimeout( function() {
		console.log("I:" + i);
		var gB = gBs[i];

		// We need a div per genomeBrowser
		var thisDiv = d3.select(div).append("div").attr("id","genomeBrowser" + i);
		gB(thisDiv[0][0]);

		var gDiv = d3.select("#genomeBrowser" + i + " .ePeek_groupDiv");
		gDiv
		    .insert("img", ":first-child")
		    .attr("src", "chevron_left.png")
		    .attr("height", 150)
		    .attr("width", 40)
		    .on("click", function(){gB.left(1.2)});
		gDiv
		    .append("img")
		    .attr("src", "chevron_right.png")
		    .attr("height", 150)
		    .attr("width", 40)
		    .on("click", function(){gB.right(1.2)});

		gB.startOnOrigin();
	    }, i * 1500);	    
	}


	for (var i = 0; i < gBs.length; i++) {
	    setupDiv(i);
	}

    };

    return gBrowserTheme;
}
