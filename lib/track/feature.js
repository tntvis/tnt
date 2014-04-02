
// FEATURE VIS
epeek.track.feature = function () {

    // Placeholders
    var create_cbak = function () {throw "create_elem is not defined in the base feature object"};
    var move_cbak = function () {throw "move_elem is not defined in the base feature object"};
    var update_cbak = function () {};

    var feature = {};

    feature.reset = function () {
    	var track = this;
    	track.g.selectAll(".ePeek_elem").remove();
    }

    feature.plot = function (new_elem, track, xScale) {
	new_elem.on("click", track.info_callback());
	create_cbak.call(track, new_elem, xScale); // new_elem is a g element where the feature is inserted
    };

    feature.update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var layout = track.layout();
	layout(track.elements(), xScale);
	var data_elems = layout.elements();

	var vis_elems = svg_g.selectAll(".ePeek_elem")
	    .data(data_elems, function (d) {
		return d[track.index()];
	    });

	update_cbak.call(this, vis_elems);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "ePeek_elem")
	// TODO: track.plotter(track) looks redundant, can we avoid passing track as the arg?
	    .call(track.plotter().plot, track, xScale);

	vis_elems
	    .exit()
	    .remove();
    };

    feature.move = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var elems = svg_g.selectAll(".ePeek_elem");

	move_cbak.call(this, elems, xScale);
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

    feature.updater = function (cbak) {
	if (!arguments.length) {
	    return update_cbak;
	}
	update_cbak = cbak;
	return feature;
    };

    return feature;
};

epeek.track.feature.gene = function () {
    var feature = epeek.track.feature();

    feature.create(function (new_elem, xScale) {
	var track = this;

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
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return track.foreground_color();
		} else {
		    return d.color
		}
	    });

	new_elem
	    .append("text")
	    .attr("class", "ePeek_name")
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
	    .duration(500)
	    .attr("fill", function() {
		return track.foreground_color();
	    });	    
    });

    feature.updater(function (genes) {
	var track = this;
	genes
	    .select("rect")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (track.layout().gene_slot().slot_height * d.slot);
	    })
	    .attr("height", track.layout().gene_slot().gene_height);

	genes
	    .select("text")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (track.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .text(function (d) {
                if (track.layout().gene_slot().show_label) {
		    return d.display_label;
                } else {
		    return "";
                }
	    });
    });

    feature.mover(function (genes, xScale) {
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

epeek.track.feature.block = function () {
    var feature = epeek.track.feature();

    feature.create(function (new_elem, xScale) {
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
	// TODO: duration should be set to the duration (var dur) defined in the genome function
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return track.foreground_color();
		} else {
		    return d.color;
		}
	    });
    });

    feature.mover(function (blocks, xScale) {
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

epeek.track.feature.pin = function () {
    var feature = epeek.track.feature();

    feature.create(function (new_elem, xScale) {
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

    feature.mover(function (pins, xScale) {
	pins
	    .select("image")
	    .attr("x", function (d) {
		return xScale(d.pos);
	    });
    })

    return feature;
};

epeek.track.feature.axis = function () {

    var xAxis;

    // Axis doesn't inherit from epeek.track.feature
    var feature = {};
    feature.reset = function () {};
    feature.plot = function () {};
    feature.update = function (xScale) {
	// Create Axis if it doesn't exist
	if (xAxis === undefined) {
	    xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("top");

	    return;
	}

	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    };

    return feature;

};