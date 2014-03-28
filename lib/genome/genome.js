"use strict"

epeek.genome = function() {

    var ens_re = /^ENS\w+\d+$/;

    // Default species and genome location
    // TODO: Encapsulate this information in an object
    var gene; // undefined
    var loc = {
	species  : "human",
	chr      : 7,
	from     : 139424940,
	to       : 141784100
    };

    var chr_length; // undefined

    var eRest = epeek.eRest();
    var path = epeek.utils.script_path("ePeek.js");
    // The REST response in general view

    // var genes  = []; // ** moved to track.js **

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    // TODO: Encapsulate this information in an object?
    var min_width = 500;
    var width     = 920;
    var height    = 0;    // This is the global height including all the tracks
    var height_offset = 20;

    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF
    // var fgColor        = d3.rgb('#000000'); // ** moved to track.js **
    var drag_allowed   = true;
    var curr_ease = d3.ease("cubic-in-out");
    var extend_canvas = {
	left  : 0,
	right : 0
    };

    // The tracks
    var tracks = [];

    // pins should be a track (a track of elements without width)
    // var pins = []; // The list of pins

    // TODO: For now, only 2 icons are used. We need more
    // var pins_icons = [path + "lib/pins/pin_red.png",
    // 		      path + "lib/pins/pin_blue.png",
    // 		      path + "lib/pins/pin_green.png",
    // 		      path + "lib/pins/pin_yellow.png",
    // 		      path + "lib/pins/pin_magenta.png",
    // 		      path + "lib/pins/pin_gray.png"];

    // Display elements (not directly exposed in the API)

    var svg;
    // TODO: This can go now that we have svg as a package variable
    // We can always refer to svg_g as svg.select("g")
    var svg_g;
    var pane;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
	left : 0,
	right : undefined,
	zoomOut : eRest.limits.region,
	zoomIn  : 200
    };
    var cap_width = 3;
    var xAxis;
    var refresh;
    var dur = 500;

    // Closure to layout the genes in the view
    // var genes_layout = epeek_genes().height(height);
    // var genes_layout = epeek.genome.layout(); // ** moved to track.js **

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
    var gBrowser = function(div) {
	div_id = d3.select(div).attr("id");

	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "ePeek_" + div_id)
	    .style("position", "relative")
	    .style("border", "2px solid")
	    .style("border-radius", "20px")
	    .style("-webkit-border-radius", "20px")
	    .style("-moz-border-radius", "20px")
	    .style("width", (width + cap_width*2 + extend_canvas.right + extend_canvas.left) + "px")
	    // .style("height", (height + 70) + "px");

	// genes_layout.height(height); // ** moved to track.js **

	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

	// The Browser div
	//var browserDiv = d3.select(div);

	var locRow = browserDiv
	    .append("div")
	    .attr("class", "ePeek_locRow")
	    .style("margin-left",  extend_canvas.left + "px");

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
	locRow
	    .append("span")
	    .text("Current location: ");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_species")
	    .text(loc.species);
	locRow
	    .append("span")
	    .text(" (");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_chr")
	    .text(loc.chr);
	locRow
	    .append("span")
	    .text(":");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_from")
	    .text(loc.from);
	locRow
	    .append("span")
	    .text("-");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_to")
	    .text(loc.to);
	locRow
	    .append("span")
	    .text(")");
	locRow
	    .append("img")
	    .attr("class", "ePeek_activity_signal")
	    .attr("id", "ePeek_" + div_id + "_activity_signal")
	    .attr("src", path + "lib/green_button_small.png")
 	    .style("position", "absolute")
	    .style("left", (width - 20 + extend_canvas.right) + "px");

    };


    // new_genes does several things:
    // 1.- updates the 'genes' variable
    // 2.- Calls the genes callback
    // 3.- Sets the display_label

    // ** moved to track.js **
    // var new_genes = function(genes_arr) {
    // 	for (var i = 0; i < genes_arr.length; i++) {
    // 	    if (genes_arr[i].strand === -1) {
    // 		genes_arr[i].display_label = "<" + genes_arr[i].external_name
    // 	    } else {
    // 		genes_arr[i].display_label = genes_arr[i].external_name + ">";
    // 	    }
    // 	}

    // 	genes = genes_arr;
    // 	gBrowser.genes_callback(genes);
    // 	return;
    // };

    gBrowser.start = function (where) {
	// TODO:  Not sure if we should fall back to a default
	start_activity();
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = loc.species;
		} else {
		    loc.species = where.species
		}
		if (where.chr === undefined) {
		    where.chr = loc.chr;
		} else {
		    loc.chr = where.chr;
		}
		if (where.from === undefined) {
		    where.from = loc.from;
		} else {
		    loc.from = where.from;
		}
		if (where.to === undefined) {
		    where.to = loc.to;
		} else {
		    loc.to = where.to;
		}
	    }
	} else { // "where" is undef so look for gene or loc
	    if (gBrowser.gene() !== undefined) {
		get_gene({ species : gBrowser.species(),
			   gene    : gBrowser.gene()
			 });
		return;
	    } else {
		where = {};
		where.species = loc.species,
		where.chr     = loc.chr,
		where.from    = loc.from,
		where.to      = loc.to
	    }
	}

	// Get the chromosome length
	eRest.call({url : eRest.url.chr_info ({species : where.species,
					       chr     : where.chr
					      }),
		    success : function (resp) {
			stop_activity();
			chr_length = resp.length;
			limits.right = chr_length;
			zoomEventHandler.xExtent([0, limits.right]);

			// We respect limits.zoomIn and limits.right
			// TODO: We assume that we don't have any scaffold or contig
			// with length < limits.zoomIn
			if ((where.to - where.from) < limits.zoomIn) {
			    if ((where.from + limits.zoomIn) > limits.right) {
				where.from = limits.right - limits.zoomIn;
				where.to = limits.right;
			    } else {
				where.to = where.from + limits.zoomIn;
			    }
			}

			// One general plot for axis and scales
			plot();

			var update_track = function (track) {
			    var data_updater = track.update();
			    data_updater({
				'loc' : { species : where.species,
					  chr     : where.chr,
					  from    : where.from,
					  to      : where.to
					},
			    	'on_success' : function () {
			    	    stop_activity();
				    // track.updater is vis updater
			    	    track.updater();
				}
			    });
			}

			for (var i = 0; i < tracks.length; i++) {
			    start_activity();
 			    update_track(tracks[i]);
			}
					
		    }
		   }
		  );
    };


    // we need a general plot
	var plot = function() {
	    xScale = d3.scale.linear()
		.domain([loc.from, loc.to])
		.range([0, width]);

	    xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("top");

	    if (drag_allowed) {
		pane.call( zoomEventHandler
			   .x(xScale)
			   .scaleExtent([(loc.to-loc.from)/(limits.zoomOut-1), (loc.to-loc.from)/limits.zoomIn])
			   .on("zoom", zoom)
			 );
	    }

	    update_axis();
	};

    var update_axis = function() {
    	svg_g.call(xAxis);

	// loc_row
	var xScale_domain = xScale.domain();
	d3.select("#ePeek_" + div_id + "_species")
	    .text(loc.species);
	d3.select("#ePeek_" + div_id + "_chr")
	    .text(loc.chr);
	d3.select("#ePeek_" + div_id + "_from")
	    .text(~~xScale_domain[0]);
	d3.select("#ePeek_" + div_id + "_to")
	    .text(~~xScale_domain[1]);

    };

    // TODO: I think plot_track is not needed since update_layout has to always run the layout on the genes
    // var plot_track = function (track) {

    // 	track.track.layout()(track.track.elements(), xScale);
    // 	// genes_layout(genes, xScale);

    // 	update_layout(track);

    // };


    // **************************************************
    // PLOTTERS AND UPDATERS FOR DIFFERENT TYPES OF DATA
    // **************************************************

    // TODO: Most of the plotters and updaters share code (data binding, calling the plotter on new elements, etc...
    // Explore ways of not repeating code (ie. inheritance? (better not) or bind-ing functions?)

    // FEATURES
    var feature_plot = function (new_elem, track) {
	new_elem.on("click", track.info_callback());

	new_elem
	    .append("rect")
	    .attr("class", "ePeek_elem")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", function (d) {
		return track.layout().gene_slot().slot_height * d.slot;
		// return genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })

	    .attr("height", track.layout().gene_slot().gene_height)
	    // .attr("height", genes_layout.gene_slot().gene_height)  // This has to be dynamic now

	    .attr("fill", track.background_color())
	    .transition().duration(dur).attr("fill", function (d) {
		if (d.color === undefined) {
		    return track.foreground_color();
		} else {
		    return d.color;
		}
	    });

	new_elem
	    .append("text")
	    .attr("class", "ePeek_name")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", function (d) {
		return (track.layout().gene_slot().slot_height * d.slot) + 25;
		// return (genes_layout.gene_slot().slot_height * d.slot) + 25 // TODO: This 25 is artificial. It is supposed to give enough room for the label
		// i.e. the font vertical size is less than 25.
		// Maybe it would be better to have a fixed font-size at least?
	    })
	    .attr("fill", track.background_color())
	    .text(function (d) {
		if (track.layout().gene_slot().show_label) {
		// if (genes_layout.gene_slot().show_label) {
		    return d.display_label
		} else {
		    return ""
		}
	    })
	    .style ("font-weight", function () {
		return "normal";
	    })
	    .transition().duration(dur).attr("fill", function () {
		return track.foreground_color();
	    });

    };

    // feature_update only works with "feature" types.
    // If we have pins update_pins should be used instead
    var feature_update = function () {	
	var track = this;
	var svg_g = track.g;
	track.layout()(track.elements(), xScale);
	var newdata = track.layout().genes();
	// var newdata = genes_layout.genes();
	var g_elems = svg_g.selectAll(".ePeek_gs")
	    .data(newdata, function (d) {
		return d.ID
	    });

	g_elems.selectAll(".ePeek_elem")
	// TODO: The data needs to be re-joint for all the sub-elements?
	    .data(newdata, function (d) {return d[track.index()]})
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return track.layout().gene_slot().slot_height * d.slot;
		// return genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("height", track.layout().gene_slot().gene_height);
	    // .attr("height", genes_layout.gene_slot().gene_height)

	// TODO: We don't have name on non-gene tracks
	g_elems.selectAll(".ePeek_name")
	// The data needs to be re-joint for all the sub-elements?
	    .data(newdata, function (d) {return d[track.index()]})
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (track.layout().gene_slot().slot_height * d.slot) + 25;
		  // return (genes_layout.gene_slot().slot_height * d.slot) + 25
	    })
	    .text(function (d) {
		if (track.layout().gene_slot().show_label) {
		// if (genes_layout.gene_slot().show_label) {
		    return d.display_label;
		} else {
		    return "";
		}
	    });
	
	g_elems
	    .enter()
	    .append("g")
	    .attr("class", "ePeek_gs")
	    .call(track.plotter, track)

	g_elems.exit().remove();

	// g_genes.on("click", gBrowser.gene_info_callback);


	// ** pins should be re-implemented as a track **
	// We insert the pins
	// var g_pins = svg_g.selectAll(".ePeek_pin")
	//     .data(pins.filter(function(d){
	// 	return (d.pos>loc.from && d.pos<loc.to)
	//     }), function(d) {return d.pos});

	// g_pins
	//     .enter()
	//     .append("image")
	//     .attr("class", "ePeek_pin")
	//     .attr("xlink:href", function(d) {return d.url})
	//     .attr("x", function(d){return xScale(d.pos)})
	//     .attr("y", height - 40)
	//     .attr("width", "20px")
	//     .attr("height", "20px");
	// g_pins.exit().remove();

	// track.mover(track);
	// move_track(track);

    };

    // BLOCKS
    var block_plot = function (new_elem, track) {
	new_elem.on("click", track.info_callback());

	new_elem
	    .append("rect")
	    // .attr("class", "ePeek_block")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", 0)
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", track.height())
	    .attr("fill", track.background_color())
	    .transition().duration(dur).attr("fill", function (d) {
		if (d.color === undefined) {
		    return track.foreground_color();
		} else {
		    return d.color;
		}
	    });
    };

    var block_update = function () {
	var track = this;
	var svg_g = track.g;
	// TODO: This will be selecting elements from other instances of the plug-in
	// Since it is indexing by position. Is this a problem? Should we include the div_id in the class?
	// var blocks = svg_g.selectAll(".ePeek_block")

	//     .data(track.elements().filter(function (d) {
	// 	return ((d.pos > loc.from) && (d.pos < loc.to));
	//     }));// , function (d) {return d.start});	

	var els = track.elements();

	// TODO: The filtering should be done by the retriever server side	
	els = els.filter(function (d) {
	    return (((d.start > loc.from) && (d.start < loc.to)) || 
		    ((d.end > loc.from) && (d.end < loc.to )))
	});
	
	var blocks = svg_g.selectAll(".ePeek_block")
	    .data(els);
	
	var new_block = blocks
	    .enter();

	new_block
	    .append("g")
	    .attr("class", "ePeek_block")
	    .call(track.plotter, track);

	blocks.exit().remove();
    };

    // PINS
    var pin_plot = function (new_elem, track) {
	new_elem.on("click", track.info_callback());
	new_elem
	    .append("image")
	    .attr("class", "ePeek_pin")
	    .attr("xlink:href", function() {return track.pin_url()})
	    .attr("x", function(d) {return xScale(d.pos)})
	    .attr("y", track.height() - 25)
	    .attr("width", "20px")
	    .attr("height", "20px");
    };

    var pin_update = function () {
	var track = this;
	var svg_g = track.g
	// We are not defining pin layouts for now
	var new_pins = track.elements();
	// TODO: The filtering should be done by the retriever server side
	var pins = svg_g.selectAll(".ePeek_gpin")
	    .data(new_pins.filter(function (d) {
		return ((d.pos > loc.from) && (d.pos < loc.to));
	    }), function (d) {return d.pos});

	pins
	    .enter()
	    .append("g")
	    .attr("class", "ePeek_gpin")
	    .call(track.plotter, track);

	pins.exit().remove();

	// TODO: We shouldn't be calling move_track on every track.
	// Maybe having all the plotters and updaters in a class that
	// automatically calls "move_track" after updating
	// By the way... Is it needed to call move_track here?
	// track.mover(track);
	// move_track(track);
    };

    // TODO: Should we have one move_track per type of display?
    var feature_move = function () {
	var track = this;
	var svg_g = track.g;

	// Move genes
	var g_elems = svg_g.selectAll(".ePeek_gs");

	g_elems.select(".ePeek_elem")
    	    .attr("x", function (d) {
    		return (xScale(d.start));
    	    })
    	    .attr("width", function (d) {
    		return (xScale(d.end) - xScale(d.start));
    	    });

	g_elems.select(".ePeek_name")
    	    .attr("x", function (d) {
    		return (xScale(d.start));
    	    });
    };

    var block_move = function () {
	var track = this;
	var svg_g = track.g;
	var blocks = svg_g.selectAll(".ePeek_block");

	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    };

    var pin_move = function () {
	var track = this;
	// Move pins
	var svg_g = track.g;
	var p_elems = svg_g.selectAll(".ePeek_gpin");
	p_elems.select(".ePeek_pin")
	    .attr("x", function(d) {return xScale(d.pos)});

	// We also update the pins
	// ** pins will be re-implemented as a track
	// var g_pins = svg_g.selectAll(".ePeek_pin")
	//     .attr("x", function(d) {
	// 	return (xScale(d.pos));
	//     });
	
    };

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
	var ease = gBrowser.ease();

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
    gBrowser.right = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, 1);
	}
    };

    /** <strong>left</strong> pans the genome browser to the left. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of panning (i.e. 1.2 means 20% panning)
    */
    gBrowser.left = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, -1);
	}
    };

    /** <strong>zoom</strong> zooms in/out the genome browser. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of zooming (i.e. 1.2 means zooming in 20% and 0.8 means zooming out 20%)
    */
    gBrowser.zoom = function (factor) {
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

	if (domain[1] >= chr_length-5) {
	    d3.select("#ePeek_" + div_id + "_3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	window.clearTimeout(refresh);
	refresh = window.setTimeout(function(){
	    var currDomain = xScale.domain();
	    gBrowser.from(~~currDomain[0]);
	    gBrowser.to(~~currDomain[1]);

	    for (var i = 0; i < tracks.length; i++) {
		start_activity();
		var track = tracks[i];
		(function(t) {
		    track.update()( { 'loc' : { species : loc.species,
					      chr     : loc.chr,
					      from    : loc.from,
					      to      : loc.to
					    },
				    'on_success' : function () {
					stop_activity();
					// track.track.layout()(track.track.elements, xScale);
					// TODO: This is vis updater, no data
					// It would be better to have a different name for vis updates and data updates
					t.updater();
				    }
				  }
				);
		})(track);
	    }

	    // eRest.call({url : eRest.url.region({species : loc.species,
	    // 					chr     : loc.chr,
	    // 					from    : loc.from,
	    // 					to      : loc.to
	    // 				       }),
	    // 		success : function(resp) {
	    // 		    stop_activity();
	    // 		    d3.select("#ePeek_" + div_id + "_pane")
	    // 			.classed("ePeek_dark_pane", false);
	    // 		    d3.select("#ePeek_" + div_id + "_tooWide")
	    // 	    		.classed("ePeek_tooWide_text", false)
	    // 		    new_genes(resp);
	    // 		    genes_layout(resp, xScale);
	    // 		    update_layout();
	    // 		},

	    // 		error : function() {
	    // 		    stop_activity();
	    // 		    d3.select("#ePeek_" + div_id + "_pane")
	    // 			.classed("ePeek_dark_pane", true);
	    // 		    d3.select("#ePeek_" + div_id + "_tooWide")
	    // 	    		.classed("ePeek_tooWide_text", true)
	    // 			.moveToFront();
	    // 		}
	    // 	       }
	    // 	      );
	}, 300); //
	
	// update the axis and scale
	update_axis();

	// TODO: I think it is not needed to update individual tracks
	// if we have all the elements under the same classes! (or have a "movable" class)
	// -- The problem is that not all the elements are the same (some have width some don't for example)
	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    track.mover(track);
	}
    };


    // public methods (API)


    /** <strong>resize</strong> takes a new width (in pixels) for the genome view and resizes it accordingly. It can be used to resize the view lively. For example it is used by the mobile theme to respond to orientation changes in the device
	@param {Number} width New width (in pixels)
    */
//     gBrowser.resize = function (w) {
// 	// Resize the svg
// 	d3.select(".ePeek_svg").attr("width", w);
// 	// Resize the zooming/panning pane
// 	d3.select("#ePeek_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");

// 	// Move the activity signal
// 	var curr_width = gBrowser.width();
// 	var activity_signal = d3.select("#ePeek_" + div_id + "_activity_signal");
// 	var curr_left = parseInt(activity_signal.style("left"));
// 	activity_signal.style("left", (curr_left + (w - curr_width)) + "px");

// 	// Set the new width
// 	gBrowser.width(w);

// 	// Replot
// 	plot();
// 	update();
//     };

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	start_activity();
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    stop_activity();
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				gBrowser.xref_search_callback(resp);
				get_ensGene(resp[0].id)
			    } else {
				gBrowser.start();
			    }
			}
		       }
		      );
	}
    };

    ///*********************////
    /// DATA RETRIEVERS     ////
    ///*********************////
    /** <strong>homologues</strong> looks for homologues of the given gene.
	Once the homologues are retrieved, the optional callback given as the second argument is invoked passing the array of homologues as its argument. These homologues have the following information:
	<ul>
	<li>id          => The Ensembl Gene ID of the homolog</li>
	<li>protein_id  => The Ensembl Protein ID of the homolog</li>
	<li>species     => The species name of the homolog</li>
	<li>subtype     => The subtype of the homology relantionship</li>
	<li>type        => The type of homology</li>
	</ul>
	@param {string} ensGene The id of the gene to look for homologues
	@param {Callback} [callback] The callback to be called on the array of homologues
    */
    gBrowser.homologues = function (ensGene, callback)  {
	start_activity();
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			stop_activity();
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var get_ensGene = function (id) {
	start_activity();
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			stop_activity();

			gBrowser.ensgene_search_callback(resp);

			gBrowser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			gBrowser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start,
					  to      : resp.end
					} );
		    }
		   });
    };


    ///***********************////
    /// Setters & Getters     ////
    ///***********************////

    /** <strong>species</strong> gets/sets the species used in the REST queries.
	If no argument is provided, returns the current species.
	Common names are allowed (human, chimp, gorilla, mouse, etc...)
	Binary scientific names are also allowed with and without underscores (for example "mus_musculus" or "mus musculus")
	Case is ignored.
	@param {String} [species] The new species
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.species = function (sp) {
	if (!arguments.length) {
	    return loc.species;
	}
	loc.species = sp;
	return gBrowser;
    };

    /** <strong>chr</strong> gets/sets the chr used in the next genome coordinates-based query.
	If no argument is provided, returns the current chr or the default one if no one has been set before.
	Strictly speaking, the arguments expects a seq_region_name, i.e. "scaffolds", etc are also considered chromosomes.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {String} [chr] The new chr
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.chr  = function (c) {
	if (!arguments.length) {
	    return loc.chr;
	}
	loc.chr = c;
	return gBrowser;
    };

    /** <strong>from</strong> gets/sets the start coordinate to start the genome browser with
	If no argument is provided, returns the current start coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinte] The new start coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.from = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.from;
	}
	loc.from = pos;
	return gBrowser;
    };

    /** <strong>to</strong> gets/sets the end coordinate to start the genome browser with
	If no argument is provided, returns the current end coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinate] The new end coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.to = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.to;
	}
	loc.to = pos;
	return gBrowser;
    };

    /** <strong>gene</strong> sets the gene name for the next gene-based location.
	External gene names (BRCA2) and ensembl gene identifiers (ENSG00000139618) are both allowed.
	Gene-based locations have higher preference over coordinates-based locations.
	@example
	// Will show the correct location even if the gene name is spelled wrong
	// or is not recognized by Ensembl
	gB.species("human").chr(13).from(35009587).to(35214822).gene("LINC00457");
	@param {String} [name] The name of the gene
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return gBrowser;
    };


    /** <strong>height</strong> gets/sets the height of the plug-in.
	If no argument is provided, returns the current height.
	The argument should be only the number of pixels (without any suffix like "px")
	@param {Number} [height] The new height (in pixels)
	@returns {ePeek} The original object allowing method chaining
    */
	// TODO: Now that we have tracks, height should be treated differently
	// The unique way of increasing the height is by adding more tracks
    // gBrowser.height = function (h) {
    // 	// TODO: Allow suffixes like "1000px"?
    // 	// TODO: Test wrong formats
    // 	if (!arguments.length) {
    // 	    return height;
    // 	}

    // 	// We are resizing
    // 	if (div_id !== undefined) {
    // 	    d3.select(".ePeek_svg").attr("height", h);
    // 	    // Resize the zooming/panning pane
    // 	    d3.select("#ePeek_" + div_id).style("height", (parseInt(h) + 40) + "px");
    // 	    d3.select("#ePeek_" + div_id + "_pane").attr("height", h);
    // 	    height = h;

    // 	    // The overlap detector needs to have the new height set
    // 	    genes_layout.height(height);

    // 	    // Replot
    // 	    plot();
    // 	    update_layout();
    // 	} else {
    // 	    height = h;
    // 	}

    // 	return gBrowser;
    // };

	// adding a new track
    gBrowser.add_track = function (track) {
	    // var curr_svg_height = svg.attr("height")

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
		.attr("width", gBrowser.width())
		.attr("height", track.height())
		.style("fill", track.background_color())
		.style("pointer-events", "none");

	    // The track plotter and track updater
	    if (track.display() === "feature") {
		var gene_vis = epeek.genome.feature.gene();
		track.plotter = gene_vis.plot;
		// track.plotter = feature_plot;
		track.updater = gene_vis.update;
		// track.updater = feature_update;
		track.mover = gene_vis.move;
		// track.mover   = feature_move;
	    }

	    if (track.display() === "pin") {
		var pin_vis = epeek.genome.feature.pin();
		track.plotter = pin_vis.plot;
		// track.plotter = pin_plot;
		track.updater = pin_vis.update;
		// track.updater = pin_update;
		track.mover = pin_vis.move;
		// track.mover   = pin_move;
	    }

	    if (track.display() === "block") {
		var block_vis = epeek.genome.feature.block();
		track.plotter = block_vis.plot;
		// track.plotter = block_plot;
		track.updater = block_vis.update;
		// track.updater = block_update;
		track.mover = block_vis.move;
		// track.mover   = block_move;
	    }

	    // We update the height of the plug-in
	    height = height + track.height();

	    // svg
	    svg.attr("height", height + height_offset);

	    // gBrowserDiv
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

	    tracks.push(track);
	};

	// ** pins will be re-implemented as a track **
    // gBrowser.pin = function (pins_arr, url) {
    // 	if (url === undefined) {
    // 	    url = pins_icons.shift(); // TODO: We may have run out of icons. Check!
    // 	}
    // 	for (var i = 0; i < pins_arr.length; i++) {
    // 	    pins.push ({
    // 		pos  : pins_arr[i],
    // 		url  : url
    // 	    });
    // 	}
    // 	console.log("PINS:");
    // 	console.log(pins);
    // 	return url;
    // };

    gBrowser.extend_canvas = function (d) {
	if (!arguments.length) {
	    return extend_canvas;
	}

	if (d.left !== undefined) {
	    extend_canvas.left = d.left;
	}
	if (d.right !== undefined) {
	    extend_canvas.right = d.right;
	}

	return gBrowser;
	
    };

    /** <strong>width</strong> gets/sets the width (in pixels) of the plug-in.
	If no argument is provided, returns the current height.
	The argument should be only the number of pixels (without any suffix like "px")
	To re-set the width lively use the {@link ePeek.resize} method.
	@param {Number} [width] The new width (in pixels)
	@returns {ePeek} The original object allowing method chaining	
    */
    gBrowser.width = function (w) {
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
		tracks[i].updater();
	    }
	    
	} else {
	    width = w;
	}
	
	return gBrowser;
    };

    /** <strong>background_color</strong> gets/sets the background color for the view.
	If no argument is provided, returns the current background color.
	The argument should be a valid hexadecimal number (including the "#" prefix)
	The color is internally converted to a {@link https://github.com/mbostock/d3/wiki/Colors#wiki-d3_rgb|d3.rgb} format
	@param {String} [color] The new color in hexadecimal format (including the leading "#")
	@returns {ePeek} The original object allowing method chaining	
    */
    // gBrowser.background_color = function (hex) {
    // 	if (!arguments.length) {
    // 	    return bgColor;
    // 	}
    // 	bgColor = d3.rgb(hex);
    // 	return gBrowser;
    // };

    /** <strong>foreground_color</strong> gets/sets the foreground color for the view.
	If no argument is provided, returns the current foreground color.
	The argument should be a valid hexadecimal number (including the "#" prefix)
	The color is internally converted to a {@link https://github.com/mbostock/d3/wiki/Colors#wiki-d3_rgb|d3.rgb} format
	@param {String} [color] The new color in hexadecimal format (including the leading "#")
	@returns {ePeek} The original object allowing method chaining	
    */
	// ** moved to track.js **
    // gBrowser.foreground_color = function (hex) {
    // 	if (!arguments.length) {
    // 	    return fgColor;
    // 	}
    // 	fgColor = d3.rgb(hex);
    // 	return gBrowser;
    // };

	// ** moved to track.js **
    // gBrowser.genes = function() {
    // 	return genes;
    // };

    gBrowser.ease = function(e) {
	if (!arguments.length) {
	    return curr_ease;
	}
	curr_ease = d3.ease(e);
	return gBrowser;
    };

    gBrowser.allow_drag = function(b) {
	if (!arguments.length) {
	    return drag_allowed;
	}
	drag_allowed = b;
	if (drag_allowed) {
	    // When this method is called on the object before starting the simulation, we don't have defined xScale
	    if (xScale !== undefined) {
		pane.call( zoomEventHandler.x(xScale)
			   .xExtent([0, limits.right])
			   .scaleExtent([(loc.to-loc.from)/(limits.zoomOut-1), (loc.to-loc.from)/limits.zoomIn])
			   .on("zoom", zoom) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return gBrowser;
    };

    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////

    /** <strong>split_homologues</strong> split an array of homologues into an object containing an array of orthologues (under the 'orthologues' field)
	and an array of paralogues (under the 'paralogues' field)
	@param {Array} [homologues] The array containing homologues objects
	@returns {Object} An object containing an array of orthologues and an array of paralogues
    */
    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };


    // Default callbacks

    /** <strong>gene_info_callback</strong> is a callback called when a gene is selected.
	It should be used to respond to mouse clicks on the genes or their names (labels).
	Its default behaviour is to do nothing.
	This function can be overwritten by a theme to display the gene information
	in, for example, a custom way and/or place.
	@param {Object} object A literal object containing the following fields:
	<ul>
	<li>external_name   => External name of the gene</li>
	<li>ID              => Ensembl ID of the gene</li>
	<li>description     => A short description of the gene</li>
	<li>logic_name      => The source of the gene</li>
	<li>feature_type    => This is always set to gene</li>
	<li>seq_region_name => The chromosome or region name the gene is located</li>
	<li>start           => The start coordinate in the seq_region_name</li>
	<li>end             => The end coordinate in the seq_region_name</li>
	<li>strand          => The strand in the seq_region_name</li>
	</ul>
    */

	// ** moved to track.js **
    // gBrowser.gene_info_callback = function() {};

	// TODO: These tooltips now only works with the gene track
	// Do we need to re-design this method to work with other tracks?
	// or move the tooltips to track.js? I suppose not because the fields are data specific

    // gBrowser.tooltip = function () {
    // 	var gene_tooltip = function(gene) {
    // 	    var obj = {};
    // 	    obj.header = {
    // 		label : "HGNC Symbol",
    // 		value : gene.external_name
    // 	    };
    // 	    obj.rows = [];
    // 	    obj.rows.push( {
    // 		label : "Name",
    // 		value : "<a href=''>" + gene.ID  + "</a>"
    // 	    });
    // 	    obj.rows.push( {
    // 		label : "Gene Type",
    // 		value : gene.biotype
    // 	    });
    // 	    obj.rows.push( {
    // 		label : "Location",
    // 		value : "<a href=''>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end  + "</a>"
    // 	    });
    // 	    obj.rows.push( {
    // 		label : "Strand",
    // 		value : (gene.strand === 1 ? "Forward" : "Reverse")
    // 	    });
    // 	    obj.rows.push( {
    // 		label : "Description",
    // 		value : gene.description
    // 	    });

    // 	    epeek.tooltip.call(this).table(obj);
    // 	};

    // 	return gene_tooltip;
    // };

    /** <strong>xref_search_callback</strong> is a callback called every time a gene is searched in the
	REST server.
	Its default behaviour is to do nothing.
	This method can be used by a theme to run some arbitrary code when a gene is found in the REST
	server.
	@param {Array} genes An array of genes found in the last gene-based search. Each gene is an object having the following fields:
	<ul>
	<li>id    => The Ensembl gene id associated with the gene</li>
	<li>type  => This should be "gene"
	</ul>
    */
    gBrowser.xref_search_callback = function() {};

    gBrowser.ensgene_search_callback = function() {};

    /** <strong>genes_callback</strong> is a callback executed after the REST server is called as a result of a drag/pan event.
	This callback can be used by themes to run code on the data returned by the REST server.
	@param {Array} genes An array of genes returned by the REST server. Each gene is represented by an object having the same fields described in the {@link ePeek.gene_info_callback} method.
    */
    // gBrowser.genes_callback = function() {};

    var stop_activity = function() {
	if (!eRest.connections()) {
	    d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/green_button_small.png");
	}
    };

    var start_activity = function() {
	d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/red_button_small.png");
    };


    epeek.genome.feature = function () {

	// Placeholder
	var create_cbak = function () {throw "create_elem is not defined in the base feature object"};
	var move_cbak = function () {throw "move_elem is not defined in the base feature object"};

	var feature = {};

	feature.plot = function (new_elem, track) {
	    new_elem.on("click", track.info_callback());
	    create_cbak.call(track, new_elem); // new_elem is a g element where the feature is inserted
	};

	feature.update = function () {
	    var track = this;
	    var svg_g = track.g;
	    var layout = track.layout();
	    layout(track.elements(), xScale);
	    var data_elems = layout.elements();
	    // var data_elems = track.elements();

	    var vis_elems = svg_g.selectAll(".ePeek_elem")
		.data(data_elems);

	    var new_elem = vis_elems
		.enter();

	    new_elem
		.append("g")
		.attr("class", "ePeek_elem")
	    // TODO: track.plotter(track) looks redundant, can we avoid passing track as the arg?
		.call(track.plotter, track);

	    vis_elems
		.exit()
		.remove();
	};

	feature.move = function () {
	    var track = this;
	    var svg_g = track.g;
	    var elems = svg_g.selectAll(".ePeek_elem");

	    move_cbak.call(this, elems);
	};

	// API
	feature.create = function (cbak) {
	    if (!arguments.length) {
		return create_cbak;
	    }
	    create_cbak = cbak;
	    return feature;
	};

	feature.mover = function (cbak) {
	    if (!arguments.length) {
		return move_cbak;
	    }
	    move_cbak = cbak;
	    return feature;
	};

	return feature;
    };

    epeek.genome.feature.gene = function () {
	var feature = epeek.genome.feature();

	feature.create(function (new_elem) {
	    var track = this;
	    console.log(track.layout().gene_slot().slot_height);

	    new_elem
		.append("rect")
		.attr("x", function (d) {
		    return xScale(d.start);
		})
		.attr("y", function (d) {
		    return track.layout().gene_slot().slot_height * d.slot;
		})
		.attr("width", function (d) {
		    return (xScale(d.end) - xScale(d.start));
		})
		.attr("height", track.layout().gene_slot().gene_height)
		.attr("fill", track.background_color())
		.transition()
		.duration(dur)
		.attr("fill", function (d) {
		    if (d.color === undefined) {
			return track.foreground_color();
		    } else {
			return d.color
		    }
		});

	    new_elem
		.append("text")
		.attr("x", function (d) {
		    return xScale(d.start);
		})
		.attr("y", function (d) {
		    return (track.layout().gene_slot().slot_height * d.slot) + 25;
		})
		.attr("fill", track.background_color())
		.text(function (d) {
		    if (track.layout().gene_slot().show_label) {
			return d.display_label
		    } else {
			return ""
		    }
		})
		.style("font-weight", "normal")
		.transition()
		.duration(dur)
		.attr("fill", function() {
		    return track.foreground_color();
		})
	});

	feature.mover(function (genes) {
	    genes.select("rect")
		.attr("x", function (d) {
		    return xScale(d.start);
		})
		.attr("width", function (d) {
		    return (xScale(d.end) - xScale(d.start));
		});

	    genes.select("text")
		.attr("x", function (d) {
		    return xScale(d.start);
		})
	});

	return feature;
    };

    epeek.genome.feature.block = function () {
	var feature = epeek.genome.feature();

	feature.create(function (new_elem) {
	    var track = this;
	    new_elem
		.append("rect")
		.attr("x", function (d) {
		    // TODO: start, end should be adjustable via the tracks API
		    return xScale(d.start);
		})
		.attr("y", 0)
		.attr("width", function (d) {
		    return (xScale(d.end) - xScale(d.start));
		})
		.attr("height", track.height())
		.attr("fill", track.background_color())
		.transition()
	    // duration should be set to the duration (var dur) defined in the genome function
		.duration(dur)
		.attr("fill", function (d) {
		    if (d.color === undefined) {
			return track.foreground_color();
		    } else {
			return d.color;
		    }
		});
	});

	feature.mover(function (blocks) {
	    blocks
		.select("rect")
		.attr("x", function (d) {
		    return xScale(d.start);
		})
		.attr("width", function (d) {
		    return (xScale(d.end) - xScale(d.start));
		})
	});

	return feature;

    };
    epeek.genome.feature.pin = function () {
	var feature = epeek.genome.feature();

	feature.create(function (new_elem) {
	    var track = this;
	    new_elem
		.append("image")
		.attr("xlink:href", function () {
		    return track.pin_url()
		})
		.attr("x", function (d) {
		    return xScale(d.pos)
		})
		.attr("y", track.height() - 25)
		.attr("width", "20px")
		.attr("height", "20px");
	});

	feature.mover(function (pins) {
	    pins
		.select("image")
		.attr("x", function (d) {
		    return xScale(d.pos);
		});
	})

	return feature;
    };


    return gBrowser;
};

