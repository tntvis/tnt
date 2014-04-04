"use strict"

epeek.track = function() {
    var path = epeek.utils.script_path("ePeek.js");

    var min_width = 500;
    var width     = 920;
    var height    = 0;    // This is the global height including all the tracks
    var height_offset = 20;

    // Default initial location 
    var loc = {
        from     : 0,
        to       : 500
    };


    // TODO: We have now background color in the tracks. Can this be removed?
    // It looks like it is used in the too-wide pane etc, but it may not be needed anymore
    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF

    var drag_allowed   = true;
    var curr_ease = d3.ease("cubic-in-out");
    var extend_canvas = {
	left  : 0,
	right : 0
    };

    // The tracks
    var tracks = [];

    var svg;
    // TODO: This can go now that we have svg as a package variable
    // We can always refer to svg_g as svg.select("g")
    var svg_g;

    // TODO: Explain what pane is for or choose a better self-explanatory name if possible
    var pane;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits_cbak = function () {throw "This method should be defined"};
    var limits = {
	left : 0,
	right : 1000,
	zoom_out : 1000,
	zoom_in  : 100
    };

    var cap_width = 3;
//    var xAxis;
    var refresh;
    var dur = 500;

    // The id of the div element the plug-in connects to
    // undefined by default
    var div_id;

    /** The returned closure
	@namespace
	@alias ePeek
	@example
	// Typically, the plug-in is used as follows:
	var gB = epeek().width(920); // other methods can be included here
	var gBTheme = epeek_theme(); // other methods can be included here
	gBTheme(gB, document.getElementById('DOM_element_id');
    */
    var track_vis = function(div) {
	div_id = d3.select(div).attr("id");

	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

	// TODO: Move the styling to the scss?
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "ePeek_" + div_id)
	    .style("position", "relative")
	    .style("border", "2px solid")
	    .style("border-radius", "20px")
	    .style("-webkit-border-radius", "20px")
	    .style("-moz-border-radius", "20px")
	    .style("width", (width + cap_width*2 + extend_canvas.right + extend_canvas.left) + "px")

	// TODO: locRow should be converted into a track
// 	var locRow = browserDiv
// 	    .append("div")
// 	    .attr("class", "ePeek_locRow")
// 	    .style("margin-left",  extend_canvas.left + "px");

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	// The SVG
	svg = groupDiv
	    .append("svg")
	    .attr("class", "ePeek_svg")
	    .attr("width", width)
	    .attr("height", height);

	svg_g = svg
	    // .attr("height", height)
	    // .style("background-color", bgColor)
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "ePeek_g");

	// caps
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "_5pcap")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "_3pcap")
	    .attr("x", width-cap_width)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "ePeek_pane")
	    .attr("id", "ePeek_" + div_id + "_pane")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", bgColor);

	// ** TODO: Wouldn't be better to have these messages by track?
	var tooWide_text = svg_g
	    .append("text")
	    .attr("class", "ePeek_wideOK_text")
	    .attr("id", "ePeek_" + div_id + "_tooWide")
	    .attr("fill", bgColor)
	    .text("Region too wide");

	// TODO: I don't know if this is the best way (and portable) way
	// of centering the text in the text area
	var bb = tooWide_text[0][0].getBBox();
	tooWide_text
	    .attr("x", ~~(width/2 - bb.width/2))
	    .attr("y", ~~(height/2 - bb.height/2));


	// The locRow
// 	locRow
// 	    .append("span")
// 	    .text("Current location: ");
// 	locRow
// 	    .append("span")
// 	    .attr("id", "ePeek_" + div_id + "_species")
// 	    .text(loc.species);
// 	locRow
// 	    .append("span")
// 	    .text(" (");
// 	locRow
// 	    .append("span")
// 	    .attr("id", "ePeek_" + div_id + "_chr")
// 	    .text(loc.chr);
// 	locRow
// 	    .append("span")
// 	    .text(":");
// 	locRow
// 	    .append("span")
// 	    .attr("id", "ePeek_" + div_id + "_from")
// 	    .text(loc.from);
// 	locRow
// 	    .append("span")
// 	    .text("-");
// 	locRow
// 	    .append("span")
// 	    .attr("id", "ePeek_" + div_id + "_to")
// 	    .text(loc.to);
// 	locRow
// 	    .append("span")
// 	    .text(")");
// 	locRow
// 	    .append("img")
// 	    .attr("class", "ePeek_activity_signal")
// 	    .attr("id", "ePeek_" + div_id + "_activity_signal")
// 	    .attr("src", path + "lib/green_button_small.png")
//  	    .style("position", "absolute")
// 	    .style("left", (width - 20 + extend_canvas.right) + "px");
    };


    // track_vis always starts on loc.from & loc.to
    track_vis.start = function () {
	// start_activity();

	for (var i=0; i<tracks.length; i++) {
	    init_tracks(tracks[i]);
	}

	// The continuation callback
	var cont = function (resp) {
	    // stop_activity();
	    if (resp.right !== undefined) {
		limits.right = resp.right;
	    }
	    if (resp.left !== undefined) {
		limits.left = resp.left;
	    }
	    if (resp.zoom_in !== undefined) {
		limits.zoom_in = resp.zoom_in;
	    }
	    if (resp.zoom_out !== undefined) {
		limits.zoom_out = resp.zoom_out;
	    }

	    zoomEventHandler.xExtent([limits.left, limits.right]);
	    if ((loc.to - loc.from) < limits.zoom_in) {
		if ((loc.from + limits.zoom_in) > limits.zoom_in) {
		    loc.to = limits.right;
		} else {
		    loc.to = loc.from + limits.zoom_in;
		}
	    }
	    plot();

	    for (var i=0; i<tracks.length; i++) {
		tracks[i].display().reset.call(tracks[i]);
		// start_activity();
		update_track(tracks[i], loc);
	    }
	};

	limits_cbak(cont);
    };

    var update_track = function (track, where) {
	var data_updater = track.data().update();
	data_updater({
	    'loc' : where,
	    'on_success' : function () {
		// stop_activity();
		// track.updater is vis updater
		track.display().update.call(track, xScale);
	    }
	});
    };

    // we need a general plot
    var plot = function() {

	xScale = d3.scale.linear()
	    .domain([loc.from, loc.to])
	    .range([0, width]);

// 	xAxis = d3.svg.axis()
// 	    .scale(xScale)
// 	    .orient("top");

	if (drag_allowed) {
	    pane.call( zoomEventHandler
		       .x(xScale)
		       .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
		       .on("zoom", zoom)
		     );
	}

	// update_axis();
    };

    // var update_axis = function() {
    // 	svg_g.call(xAxis);

    // 	// loc_row
    // 	var xScale_domain = xScale.domain();
    // 	d3.select("#ePeek_" + div_id + "_species")
    // 	    .text(loc.species);
    // 	d3.select("#ePeek_" + div_id + "_chr")
    // 	    .text(loc.chr);
    // 	d3.select("#ePeek_" + div_id + "_from")
    // 	    .text(~~xScale_domain[0]);
    // 	d3.select("#ePeek_" + div_id + "_to")
    // 	    .text(~~xScale_domain[1]);

    // };


    var move = function (factor, direction) {
	var oldDomain = xScale.domain();

	var span = oldDomain[1] - oldDomain[0];
	var offset = (span * factor) - span;

	var newDomain;
	switch (direction) {
	case -1 :
	    newDomain = [(~~oldDomain[0] - offset), ~~(oldDomain[1] - offset)];
	    break;
	case 1 :
	    newDomain = [(~~oldDomain[0] + offset), ~~(oldDomain[1] - offset)];
	    break;
	case 0 :
	    newDomain = [oldDomain[0] - ~~(offset/2), oldDomain[1] + (~~offset/2)];
	}

	var interpolator = d3.interpolateNumber(oldDomain[0], newDomain[0]);
	var ease = track_vis.ease();

	var x = 0;
	d3.timer(function() {
	    var curr_start = interpolator(ease(x));
	    var curr_end;
	    switch (direction) {
	    case -1 :
		curr_end = curr_start + span;
		break;
	    case 1 :
		curr_end = curr_start + span;
		break;
	    case 0 :
		curr_end = oldDomain[1] + oldDomain[0] - curr_start;
		break;
	    }

	    var currDomain = [curr_start, curr_end];
	    xScale.domain(currDomain);
	    zoom(xScale);
	    x+=0.02;
	    return x>1;
	});
    };

    /** <strong>right</strong> pans the genome browser to the right. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of panning (i.e. 1.2 means 20% panning)
    */
    track_vis.right = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, 1);
	}
    };

    /** <strong>left</strong> pans the genome browser to the left. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of panning (i.e. 1.2 means 20% panning)
    */
    track_vis.left = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, -1);
	}
    };

    /** <strong>zoom</strong> zooms in/out the genome browser. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of zooming (i.e. 1.2 means zooming in 20% and 0.8 means zooming out 20%)
    */
    track_vis.zoom = function (factor) {
	move(factor, 0);
    };


    // We still have to make sure that button-based panning/zooming works in this version (also at the edges)
    var zoom = function (new_xScale) {

	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	var domain = xScale.domain();
	if (domain[0] <= 5) {
	    d3.select("#ePeek_" + div_id + "_5pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	if (domain[1] >= (limits.right)-5) {
	    d3.select("#ePeek_" + div_id + "_3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	window.clearTimeout(refresh);
	refresh = window.setTimeout(function(){
	    var currDomain = xScale.domain();
	    track_vis.from(~~currDomain[0]);
	    track_vis.to(~~currDomain[1]);

	    for (var i = 0; i < tracks.length; i++) {
		// start_activity();
		var track = tracks[i];
		update_track(track, loc);
	    }
	}, 300); //
	
	// update the axis and scale
	// update_axis();

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    track.display().move.call(track,xScale);
	}
    };


    // public methods (API)


    ///***********************////
    /// Setters & Getters     ////
    ///***********************////


    /** <strong>from</strong> gets/sets the start coordinate to start the genome browser with
	If no argument is provided, returns the current start coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinte] The new start coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    track_vis.from = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.from;
	}
	loc.from = pos;
	return track_vis;
    };

    /** <strong>to</strong> gets/sets the end coordinate to start the genome browser with
	If no argument is provided, returns the current end coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinate] The new end coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    track_vis.to = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.to;
	}
	loc.to = pos;
	return track_vis;
    };

    /** <strong>species</strong> gets/sets the species used in the REST queries.                                    
        If no argument is provided, returns the current species.                                                    
        Common names are allowed (human, chimp, gorilla, mouse, etc...)                                             
        Binary scientific names are also allowed with and without underscores (for example "mus_musculus" or "mus m\
usculus")                                                                                                           
        Case is ignored.                                                                                            
        @param {String} [species] The new species                                                                   
        @returns {ePeek} The original object allowing method chaining                                               
    */
    track_vis.species = function (sp) {
        if (!arguments.length) {
            return loc.species;
        }
        loc.species = sp;
        return track_vis;
    };

    /** <strong>chr</strong> gets/sets the chr used in the next genome coordinates-based query.                     
        If no argument is provided, returns the current chr or the default one if no one has been set before.       
        Strictly speaking, the arguments expects a seq_region_name, i.e. "scaffolds", etc are also considered chrom\
osomes.                                                                                                             
        This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view                
        @param {String} [chr] The new chr                                                                           
        @returns {ePeek} The original object allowing method chaining                                               
    */
    track_vis.chr  = function (c) {
        if (!arguments.length) {
            return loc.chr;
        }
        loc.chr = c;
        return track_vis;
    };

    // adding a new track
    track_vis.add_track = function (track) {
	tracks.push(track);
	return track_vis;
    };

    var init_tracks = function (track) {
	    // The g element of the track
	    track.g = svg_g
		.append("g")
		.attr("class", "ePeek_track")
		.attr("height", track.height());

	    track.g
		.attr("transform", "translate(0, " + height + ")");

	    // Rect for the background color
	    track.g
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", track_vis.width())
		.attr("height", track.height())
		.style("fill", track.background_color())
		.style("pointer-events", "none");

	    // We update the height of the plug-in
	    height = height + track.height();

	    // svg
	    svg.attr("height", height + height_offset);

	    // track_vis_div
	    d3.select("#ePeek_" + div_id)
		.style("height", (height + 40 + height_offset) + "px")


	    // caps
	    d3.select("#ePeek_" + div_id + "_5pcap")
		.attr("height", height)
		.moveToFront();
	    d3.select("#ePeek_" + div_id + "_3pcap")
		.attr("height", height)
		.moveToFront();

	    // pane
	    pane
		.attr("height", height + height_offset)

	    // tooWide
	    var tooWide_text = d3.select("#ePeek_" + div_id + "_tooWide");
	    var bb = tooWide_text[0][0].getBBox();
	    tooWide_text
		.attr("y", ~~(height/2) - bb.height/2);

	return track_vis;
    };

    track_vis.limits = function (cbak) {
	if (!arguments.length) {
	    return limits_cbak;
	}
	limits_cbak = cbak;
	return track_vis;
    };

    track_vis.extend_canvas = function (d) {
	if (!arguments.length) {
	    return extend_canvas;
	}

	if (d.left !== undefined) {
	    extend_canvas.left = d.left;
	}
	if (d.right !== undefined) {
	    extend_canvas.right = d.right;
	}

	return track_vis;
	
    };

    /** <strong>width</strong> gets/sets the width (in pixels) of the plug-in.
	If no argument is provided, returns the current height.
	The argument should be only the number of pixels (without any suffix like "px")
	To re-set the width lively use the {@link ePeek.resize} method.
	@param {Number} [width] The new width (in pixels)
	@returns {ePeek} The original object allowing method chaining	
    */
    track_vis.width = function (w) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
	if (!arguments.length) {
	    return width;
	}
	// At least min-width
	if (w < min_width) {
	    w = min_width
	}

	// We are resizing
	if (div_id !== undefined) {
	    d3.select("#ePeek_" + div_id).select("svg").attr("width", w);
	    // Resize the zooming/panning pane
	    d3.select("#ePeek_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");
	    d3.select("#ePeek_" + div_id + "_pane").attr("width", w);

	    // Move the activity signal
	    var curr_width = width;
	    var activity_signal = d3.select("#ePeek_" + div_id + "_activity_signal");
	    var curr_left = parseInt(activity_signal.style("left"));
	    activity_signal.style("left", (curr_left + (w - curr_width)) + "px");
	    width = w;

	    // Replot
	    plot();
	    for (var i=0; i<tracks.length; i++) {
		tracks[i].g.select("rect").attr("width", width);
		tracks[i].display().update.call(tracks[i],xScale);
	    }
	    
	} else {
	    width = w;
	}
	
	return track_vis;
    };


    track_vis.ease = function(e) {
	if (!arguments.length) {
	    return curr_ease;
	}
	curr_ease = d3.ease(e);
	return track_vis;
    };

    track_vis.allow_drag = function(b) {
	if (!arguments.length) {
	    return drag_allowed;
	}
	drag_allowed = b;
	if (drag_allowed) {
	    // When this method is called on the object before starting the simulation, we don't have defined xScale
	    if (xScale !== undefined) {
		pane.call( zoomEventHandler.x(xScale)
			   .xExtent([0, limits.right])
			   .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
			   .on("zoom", zoom) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return track_vis;
    };

    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////

    // var stop_activity = function() {
    // 	if (!eRest.connections()) {
    // 	    d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/green_button_small.png");
    // 	}
    // };

    // var start_activity = function() {
    // 	d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/red_button_small.png");
    // };


    return track_vis;
};

