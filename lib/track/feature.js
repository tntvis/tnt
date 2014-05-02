
// FEATURE VIS
epeek.track.feature = function () {

    ////// Vars exposed in the API
    var exports = {
	create  : function () {throw "create_elem is not defined in the base feature object"},
	mover   : function () {throw "move_elem is not defined in the base feature object"},
	updater : function () {},
	info    : function () {},
	guider  : function () {},
	index   : undefined,
	layout  : epeek.track.layout.identity(),
	foreground_color : '#000'
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".ePeek_elem").remove();
    };

    var init = function (width) {
	var track = this;
	exports.guider.call(track, width);
    };

    var plot = function (new_elems, track, xScale) {
	new_elems.on("click", exports.info);
	// new_elem is a g element where the feature is inserted
	exports.create.call(track, new_elems, xScale);
    };

    var update = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var layout = exports.layout;

	var elements = track.data().elements();
	if (field !== undefined) {
	    elements = elements[field];
	}

	layout(elements, xScale);
	var data_elems = layout.elements();

	var vis_elems;
	if (field !== undefined) {
	    vis_elems = svg_g.selectAll(".ePeek_elem_" + field)
		.data(data_elems, exports.index);
	} else {
	    vis_elems = svg_g.selectAll(".ePeek_elem")
		.data(data_elems, exports.index);
	}

	exports.updater.call(track, vis_elems);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "ePeek_elem")
	    .classed("ePeek_elem_" + field, field)
	    .call(feature.plot, track, xScale);

	vis_elems
	    .exit()
	    .remove();
    };

    var move = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var elems;
	if (field !== undefined) {
	    elems = svg_g.selectAll(".ePeek_elem_" + field);
	} else {
	    elems = svg_g.selectAll(".ePeek_elem");
	}

	exports.mover.call(this, elems, xScale);
    };

    // API
    epeek.utils.api (feature)
	.getset (exports)
	.method ({
	    reset  : reset,
	    plot   : plot,
	    update : update,
	    move   : move,
	    init   : init
	});

    return feature;
};

epeek.track.feature.composite = function () {
    var displays = {};

    var features = {};

    var reset = function () {
	var track = this;
	for (var i=0; i<displays.length; i++) {
	    displays[i].reset.call(track);
	}
    };

    var init = function (width) {
	var track = this;
	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].init.call(track, width);
	    }
	}
    };

    var update = function (xScale) {
	var track = this;
	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].update.call(track, xScale, display);
	    }
	}
    };

    var move = function (xScale) {
	var track = this;
	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].move.call(track, xScale, display);
	    }
	}
    };

    var add = function (key, display) {
	displays[key] = display;
	return features;
    };

    // API
    epeek.utils.api (features)
	.method ({
	    reset  : reset,
	    update : update,
	    move   : move,
	    init   : init,
	    add    : add
	});


    return features;
};

epeek.track.feature.gene = function () {

    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature()
	.layout(epeek.track.layout.feature())
	.index(function (d) {
	    return d.ID;
	});

    var tooltip = function () {
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


    feature.create(function (new_elems, xScale) {
	var track = this;

	new_elems
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
		    return feature.foreground_color();
		} else {
		    return d.color
		}
	    });

	new_elems
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
		return feature.foreground_color();
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

    epeek.utils.api (feature)
	.method ({
	    tooltip : tooltip
	});


    return feature;
};

epeek.track.feature.area = function () {
    var feature = epeek.track.feature.line();
    var line = feature.line();

    var area = d3.svg.area()
	.interpolate(line.interpolate())
	.tension(feature.tension());

    var data_points;

    var line_create = feature.create(); // We 'save' line creation
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
	    return;
	}

	line_create.call(track, points, xScale);

	area
	    .x(line.x())
	    .y1(line.y())
	    .y0(track.height());

	data_points = points.data();

	track.g
	    .append("path")
	    .attr("class", "ePeek_area")
	    .datum(data_points)
	    .attr("d", area)
	    .attr("fill", d3.rgb(feature.foreground_color()).brighter());

	
    });

    var line_mover = feature.mover();

    feature.mover (function (path, xScale) {
	var track = this;
	line_mover.call(track, path, xScale);

	area.x(line.x());
	track.g
	    .select(".ePeek_area")
	    .datum(data_points)
	    .attr("d", area);
    });

    return feature;

};

epeek.track.feature.line = function () {
    var feature = epeek.track.feature();

    var x = function (d) {
	return d.pos;
    };
    var y = function (d) {
	return d.val;
    };
    var tension = 0.7;
    var yScale = d3.scale.linear();
    var line = d3.svg.line().interpolate("basis");

    // line getter. TODO: Setter?
    feature.line = function () {
	return line;
    };

    feature.tension = function (t) {
	if (!arguments.length) {
	    return tension;
	}
	tension = t;
	return feature;
    };

    feature.x = function (cbak) {
	if (!arguments.length) {
	    return x;
	}
	x = cbak;
	return feature;
    };

    feature.y = function (cbak) {
	if (!arguments.length) {
	    return y;
	}
	y = cbak;
	return feature;
    };

    var data_points;

    // For now, create is a one-off event
    // TODO: Make it work with partial paths, ie. creating and displaying only the path that is being displayed
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
	    return;
	}

	line
	    .tension(tension)
	    .x(function (d) {return xScale(x(d))})
	    .y(function (d) {return track.height() - yScale(y(d))})

	data_points = points.data();

	yScale
	    .domain([0, d3.max(data_points, function (d) {
		return y(d);
	    })])
	    .range([0, track.height() - 2]);

	
	track.g
	    .append("path")
	    .attr("d", line(data_points))
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 2)
	    .style("fill", "none");

    });


    feature.mover (function (path, xScale) {
	var track = this;

	line.x(function (d) {
	    return xScale(x(d))
	});
	track.g.select("path")
	    .attr("d", line(data_points));
    });

    return feature;
};

epeek.track.feature.conservation = function () {
    // 'Inherit' from epeek.track.feature.area
    var feature = epeek.track.feature.area();

    var area_create = feature.create(); // We 'save' area creation
    feature.create  (function (points, xScale) {
	var track = this;

	area_create.call(track, d3.select(points[0][0]), xScale)
    });

    return feature;
};

epeek.track.feature.ensembl = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.guider (function (width) {
	var track = this;
	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", height_offset)
	    .attr("y2", height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height() - height_offset)
	    .attr("y2", track.height() - height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

    });

    feature.create (function (new_elems, xScale) {
	var track = this;

	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		return xScale (d.start);
	    })
	    .attr("y", height_offset)
// 	    .attr("rx", 3)
// 	    .attr("ry", 3)
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", track.height() - ~~(height_offset * 2))
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) { 
		if (d.type === 'high') {
		    return feature.foreground_color();
		}
		return d3.rgb(feature.foreground_color()).brighter(); //.brighter();
	    });
    });

    feature.mover (function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    return feature;
};

epeek.track.feature.vline = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.create (function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append ("line")
	    .attr("x1", function (d) {
		// TODO: Should use the index value?
		return xScale(feature.index()(d))
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d))
	    })
	    .attr("y1", 0)
	    .attr("y2", track.height())
	    .attr("stroke", feature.foreground_color())
	    .attr("stroke-width", 1);
    });

    feature.mover (function (vlines, xScale) {
	vlines
	    .select("line")
	    .attr("x1", function (d) {
		return xScale(feature.index()(d));
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d));
	    });
    });

    return feature;

};

epeek.track.feature.block = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.create(function (new_elems, xScale) {

	var track = this;
	new_elems
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
		    return feature.foreground_color();
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
	    });
    });

    return feature;

};

epeek.track.feature.pin = function () {
    // The path to the current ePeek.js script. Needed to reach the pngs
    var path = epeek.utils.script_path("ePeek.js");
    var pin_color = "red";
//    var pin_url = path + "lib/pins/pin_red.png";
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
            feature.pin_url (pins_icons[0]);
        }
        if (c === "blue") {
            feature.pin_url (pins_icons[1]);
        }
        if (c === "green") {
            feature.pin_url (pins_icons[2]);
        }
        return feature;
    };


    feature.create(function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append("image")
	    .attr("xlink:href", feature.pin_url())
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

    epeek.utils.api (feature)
	.getset ('pin_url', path + "lib/pins/pin_red.png");

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

    feature.init = function () {};

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
    feature.init = function () {};
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

