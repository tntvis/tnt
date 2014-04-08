
// FEATURE VIS
epeek.track.feature = function () {

    ////// Vars exposed in the API
    // Placeholders
    var create_cbak = function () {throw "create_elem is not defined in the base feature object"};
    var move_cbak = function () {throw "move_elem is not defined in the base feature object"};
    var update_cbak = function () {};
    // info_callback is a callback called every time an element is clicked
    var info_cbak = function () {};
    // Layout only applies to genes because we don't want them to overlap (genes / labels)
    // For other tracks use the identity layout
    var layout = epeek.track.layout.identity(); // For the genes track this has to be set to epeek.track.layout.gene()

    // The returned object
    var feature = {};

    feature.reset = function () {
    	var track = this;
    	track.g.selectAll(".ePeek_elem").remove();
    }

    feature.plot = function (new_elem, track, xScale) {
	new_elem.on("click", info_cbak);
	// new_elem is a g element where the feature is inserted
	create_cbak.call(track, new_elem, xScale);
    };

    feature.update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	layout(track.data().elements(), xScale);
	var data_elems = layout.elements();

	var vis_elems = svg_g.selectAll(".ePeek_elem")
	    .data(data_elems, function (d) {
		return d[track.data().index()];
	    });

	update_cbak.call(this, vis_elems);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "ePeek_elem")
	// TODO: track.plotter(track) looks redundant, can we avoid passing track as the arg?
	    .call(feature.plot, track, xScale);

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

    // Getters / Setters
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

    feature.info = function (cbak) {
	if (!arguments.length) {
	    return info_cbak;
	}
	info_cbak = cbak;
	return feature;
    };

    feature.layout = function (l) {
	if (!arguments.length) {
	    return layout;
	}
	layout = l;
	return feature;
    };

    return feature;
};

epeek.track.feature.gene = function () {

    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature()
	.layout(epeek.track.layout.feature());

    feature.tooltip = function () {
        var tooltip = epeek.tooltip().type("table");
        var gene_tooltip = function(gene) {
            var obj = {};
            obj.header = {
                label : "HGNC Symbol",
                value : gene.external_name
            };
            obj.rows = [];
            obj.rows.push( {
                label : "Name",
                value : "<a href=''>" + gene.ID  + "</a>"
            });
            obj.rows.push( {
                label : "Gene Type",
                value : gene.biotype
            });
            obj.rows.push( {
                label : "Location",
                value : "<a href=''>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end  + "</a>"
            });
            obj.rows.push( {
                label : "Strand",
                value : (gene.strand === 1 ? "Forward" : "Reverse")
            });
            obj.rows.push( {
                label : "Description",
                value : gene.description
            });

            tooltip.call(this, obj);
        };

        return gene_tooltip;
    };


    feature.create(function (new_elem, xScale) {
	var track = this;

	new_elem
	    .append("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return feature.layout().gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", feature.layout().gene_slot().gene_height)
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
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .attr("fill", track.background_color())
	    .text(function (d) {
		if (feature.layout().gene_slot().show_label) {
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
		return (feature.layout().gene_slot().slot_height * d.slot);
	    })
	    .attr("height", feature.layout().gene_slot().gene_height);

	genes
	    .select("text")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .text(function (d) {
                if (feature.layout().gene_slot().show_label) {
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
    // 'Inherit' from epeek.track.feature
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
    // The path to the current ePeek.js script. Needed to reach the pngs
    var path = epeek.utils.script_path("ePeek.js");
    var pin_color = "red";
    var pin_url = path + "lib/pins/pin_red.png";
    var pins_icons = [path + "lib/pins/pin_red.png",
                      path + "lib/pins/pin_blue.png",
                      path + "lib/pins/pin_green.png",
                      path + "lib/pins/pin_yellow.png",
                      path + "lib/pins/pin_magenta.png",
                      path + "lib/pins/pin_gray.png"];


    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.pin_color = function(c) {
        if (!arguments.length) {
            return pin_color;
        }
        pin_color = c;
        if (c === "red") {
            pin_url = pins_icons[0];
        }
        if (c === "blue") {
            pin_url = pins_icons[1];
        }
        if (c === "green") {
            pin_url = pins_icons[2]
        }
        return feature;
    };


    feature.create(function (new_elem, xScale) {
	var track = this;
	new_elem
	    .append("image")
	    .attr("xlink:href", pin_url)
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
    });

    feature.pin_url = function (new_url) {
	if (!arguments.length) {
	    return pin_url;
	}
	pin_url = new_url;
	
    };

    return feature;
};

epeek.track.feature.axis = function () {
    var xAxis;
    var orientation = "top";

    // Axis doesn't inherit from epeek.track.feature
    var feature = {};
    feature.reset = function () {
	xAxis = undefined;
    };
    feature.plot = function () {};
    feature.move = function () {
	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    }

    feature.update = function (xScale) {
	// Create Axis if it doesn't exist
	if (xAxis === undefined) {
	    xAxis = d3.svg.axis()
		.scale(xScale)
		.orient(orientation);
	}

	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    };

    feature.orientation = function (pos) {
	if (!arguments.length) {
	    return orientation;
	}
	orientation = pos;
	return feature;
    };

    return feature;
};

epeek.track.feature.location = function () {
    var row;

    var feature = {};
    feature.reset = function () {};
    feature.plot = function () {};
    feature.move = function(xScale) {
	var domain = xScale.domain();
	row.select("text")
	    .text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
    };

    feature.update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var domain = xScale.domain();
	if (row === undefined) {
	    row = svg_g;
	    row
		.append("text")
		.text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
	}
    };

    return feature;
};

