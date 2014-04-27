
// FEATURE VIS
epeek.track.feature = function () {

    ////// Vars exposed in the API
    var exports = {
	create  : function () {throw "create_elem is not defined in the base feature object"},
	mover   : function () {throw "move_elem is not defined in the base feature object"},
	updater : function () {},
	info    : function () {},
	guider  : function () {},
	layout  : epeek.track.layout.identity()
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".ePeek_elem").remove();
    };

    var init = function (xScale) {
	var track = this;
	exports.guider.call(track, xScale);
    };

    var plot = function (new_elem, track, xScale) {
	new_elem.on("click", exports.info);
	// new_elem is a g element where the feature is inserted
	exports.create.call(track, new_elem, xScale);
    };

    var update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var layout = exports.layout;

	layout(track.data().elements(), xScale);
	var data_elems = layout.elements();

	var vis_elems = svg_g.selectAll(".ePeek_elem")
	    .data(data_elems, function (d) {
		return d[track.data().index()];
	    });

	exports.updater.call(track, vis_elems);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "ePeek_elem")
	    .call(feature.plot, track, xScale);

	vis_elems
	    .exit()
	    .remove();
    };

    var move = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var elems = svg_g.selectAll(".ePeek_elem");

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

epeek.track.feature.gene = function () {

    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature()
	.layout(epeek.track.layout.feature());

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

    epeek.utils.api (feature)
	.method ({
	    tooltip : tooltip
	});


    return feature;
};

epeek.track.feature.bezier = function () {
    var path = '';
    var yScale = d3.scale.linear();
    var prev_point;

    var feature = epeek.track.feature();

    feature.create (function (new_point, xScale) {
	throw("here");
	var track = this;
	console.log("PATH CALLED ON " + path);

	yScale.range([0,track.height()])

	console.log("DATUM:");
	console.log(new_point.datum());

	if (path === '') {
	    path = 'M' + xScale(new_point.datum().pos) +
    		   ',' + yScale(new_point.datum().val);

	    track.g
		.append("path")
//		.attr("d", path)
		.attr("fill", "none")
		.attr("stroke", track.foreground_color());

	    console.log("PATH:");
	    console.log(path);

	} else {
	    path += 'Q' + xScale(prev_point.pos) +
		    ',' + yScale(prev_point.pos) +
		    ' ' + xScale(new_point.datum().pos) +
		    ',' + yScale(new_point.datum().val);

	    console.log("**PATH:");
	    console.log(path);
	}
	prev_point = new_point.datum();

	track.g.select("path")
	    .attr("d", path);
    });

    feature.limits = function (dom) {
	if (!arguments.length) {
	    return limits;
	}
	yScale.domain(dom);
	return feature; // this?
    };

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
	    .style("stroke", track.foreground_color())
	    .style("stroke-width", 1);

	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height() - height_offset)
	    .attr("y2", track.height() - height_offset)
	    .style("stroke", track.foreground_color())
	    .style("stroke-width", 1);

    });

    feature.create (function (new_elem, xScale) {
	var track = this;

	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	new_elem
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
		    return track.foreground_color();
		}
		return d3.rgb(track.foreground_color()).brighter(); //.brighter();
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


    feature.create(function (new_elem, xScale) {
	var track = this;
	new_elem
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

