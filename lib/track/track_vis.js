"use strict"

epeek.track = function() {

    //// Private vars
    var svg;
    var div_id;
    var tracks = [];
    var min_width = 500;
    var height    = 0;    // This is the global height including all the tracks
    var width     = 920;
    var height_offset = 20;
    var loc = {
        from     : 0,
        to       : 500
    };
    // TODO: We have now background color in the tracks. Can this be removed?
    // It looks like it is used in the too-wide pane etc, but it may not be needed anymore
    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF
    var pane; // Draggable pane
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
	left : 0,
	right : 1000,
	zoom_out : 1000,
	zoom_in  : 100
    };
    var cap_width = 3;
    var dur = 500;

    //// Vars exposed in the API through getters/setters
    var drag_allowed   = true;
    var curr_ease = d3.ease("cubic-in-out");
    var extend_canvas = {
	left  : 0,
	right : 0
    };
    var limits_cbak = function () {throw "The limits method should be defined"};


    // The returned closure / object
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

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	// The SVG
	svg = groupDiv
	    .append("svg")
	    .attr("class", "ePeek_svg")
	    .attr("width", width)
	    .attr("height", height);

	var svg_g = svg
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
    };


    // track_vis always starts on loc.from & loc.to
    track_vis.start = function () {

	// Reset the tracks
	for (var i=0; i<tracks.length; i++) {
	    if (tracks[i].g) {
		tracks[i].display().reset.call(tracks[i]);
	    } else {
		init_track(tracks[i]);
	    }
	}

	// The continuation callback
	var cont = function (resp) {
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
		track.display().update.call(track, xScale);
	    }
	});
    };

    var plot = function() {

	xScale = d3.scale.linear()
	    .domain([loc.from, loc.to])
	    .range([0, width]);

	if (drag_allowed) {
	    pane.call( zoomEventHandler
		       .x(xScale)
		       .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
		       .on("zoom", move)
		     );
	}

    };

    // right/left/zoom pans or zooms the track. These methods are exposed to allow external buttons, etc to interact with the tracks. The argument is the amount of panning/zooming (ie. 1.2 means 20% panning) With left/right only positive numbers are allowed.
    track_vis.right = function (factor) {
	if (factor > 0) {
	    manual_move(factor, 1);
	}
    };

    track_vis.left = function (factor) {
	if (factor > 0) {
	    manual_move(factor, -1);
	}
    };

    track_vis.zoom = function (factor) {
	manual_move(factor, 0);
    };

    track_vis.reorder = function (ids) {
	var new_tracks = [];
	// TODO: This is defining a new height, but the global height is used to defined the size of several
	// parts. We should do this dynamic
	var height = 0;

	var find_track_by_id = function (tracks, id) {
	    for (var i=0; i<tracks.length; i++) {
		if (tracks[i].id() === id) {
		    return tracks[i];
		}
	    }
	};

	var move_tracks = function (tracks) {
	    var h = 0;
	    for (var i=0; i<tracks.length; i++) {
		tracks[i].g
		    .transition()
		    .duration(dur)
		    .attr("transform", "translate(0, " + h + ")");

		h += tracks[i].height();
	    }
	};

	for (var i=0; i<ids.length; i++) {
	    var track = find_track_by_id(tracks, ids[i]);
	    if (track !== undefined) {
		new_tracks.push(track);
	    }
	}
	move_tracks(new_tracks);
    };

    track_vis.add_track = function (track) {
	tracks.push(track);
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

    // 
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

	    // Replot
	    width = w;
	    plot();
	    for (var i=0; i<tracks.length; i++) {
		tracks[i].g.select("rect").attr("width", w);
		tracks[i].display().reset.call(tracks[i]);
		tracks[i].display().update.call(tracks[i],xScale);
	    }
	    
	} else {
	    width = w;
	}
	
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
			   .on("zoom", move) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // TODO: There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return track_vis;
    };

    var init_track = function (track) {
	track.g = svg.select("g")
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
	height += track.height();

	// svg
	svg.attr("height", height + height_offset);

	// track_vis_div
	d3.select("#ePeek_" + div_id)
	    .style("height", (height + 10 + height_offset) + "px")

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

    var manual_move = function (factor, direction) {
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
	    move(xScale);
	    x+=0.02;
	    return x>1;
	});
    };


    var move_cbak = function () {
	var currDomain = xScale.domain();
	track_vis.from(~~currDomain[0]);
	track_vis.to(~~currDomain[1]);

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    update_track(track, loc);
	}
    };
    // The deferred_cbak is deferred at least this amount of time or re-scheduled if deferred is called before
    var deferred = epeek.utils.defer_cancel(move_cbak, 300);

    var move = function (new_xScale) {
	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	// Check if we are in the edges
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

	deferred();

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    track.display().move.call(track,xScale);
	}
    };


    track_vis.limits = function (cbak) {
	if (!arguments.length) {
	    return limits_cbak;
	}
	limits_cbak = cbak;
	return track_vis;
    };

    // TODO: from & to are breaking the general getter/setter rule.
    // They are writing to / reading from the loc object
    track_vis.from = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.from;
	}
	loc.from = pos;
	return track_vis;
    };

    track_vis.to = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.to;
	}
	loc.to = pos;
	return track_vis;
    };

    track_vis.species = function (sp) {
        if (!arguments.length) {
            return loc.species;
        }
        loc.species = sp;
        return track_vis;
    };

    track_vis.chr  = function (c) {
        if (!arguments.length) {
            return loc.chr;
        }
        loc.chr = c;
        return track_vis;
    };

    track_vis.ease = function(e) {
	if (!arguments.length) {
	    return curr_ease;
	}
	curr_ease = d3.ease(e);
	return track_vis;
    };


    return track_vis;
};

