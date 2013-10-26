
// This needs to be moved to ePeek.js. Remove from here or clashes are likely to occurr
var scriptPath = function (script_name) { // script_name is the filename
    var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var script_re = new RegExp(script_scaped + '$');
    var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

    var scripts = document.getElementsByTagName('script');
    var path = "";  // Default to current path
    if(scripts !== undefined) {
        for(var i in scripts) {
            if(scripts[i].src && scripts[i].src.match(script_re)) {
                return scripts[i].src.replace(script_re_sub, '$1');
            }
        }
    }
    return path;
};

var epeek_theme = function() {
    "use strict";

    var pathToScript = scriptPath('comparative.js');
    console.log("PATH_TO_SCRIPT:" + pathToScript);

    // Now, gBs is an array of gBs
    var gBrowserTheme = function(gBs, div) {

	// The controls pane
	// TODO: The style elements should be included in a CSS file should we have a separate stylesheet for this theme
	var control_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_control_pane")
	    .style("margin-left", "auto")
	    .style("margin-right", "auto")
	    .style("width", "30%")
	    .style("margin-bottom", "20px");

	var left_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].left(1.2);
		}});
	left_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_216_circle_arrow_left.png");

	var zoomin_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(0.8);
		}
	    });
	zoomin_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_190_circle_plus.png");

	var zoomout_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(1.2);
		}
	    });
	zoomout_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_191_circle_minus.png");

	var right_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].right(1.2);
		}
	    });
	right_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_217_circle_arrow_right.png");

	var origin_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].startOnOrigin();
		}
	    });
	origin_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_242_google_maps.png");

	var setupDiv = function (i) {
	    setTimeout( function() {
		var gB = gBs[i];

		// We need a div per genomeBrowser
		var thisDiv = d3.select(div).append("div").attr("id","genomeBrowser" + i);
		gB(thisDiv[0][0]);

		var gDiv = d3.select("#genomeBrowser" + i + " .ePeek_groupDiv");
		gDiv
		    .insert("img", ":first-child")
		    .attr("src", pathToScript + "../chevron_left.png")
		    .attr("height", 150)
		    .attr("width", 40)
		    .on("click", function(){gB.left(1.2)});
		gDiv
		    .append("img")
		    .attr("src", pathToScript + "../chevron_right.png")
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
