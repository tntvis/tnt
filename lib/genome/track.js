"use strict"

epeek.genome.track = function() {

    // The label for the track. If empty, no label is displayed in the track
    var label = "";

    // display type, can be "feature", "block" or "pin"
    var display = "feature";

    // elements is the data to display in the track
    var elements  = [];

    // index is the field to index the elements for d3 (data-joining)
    // Can be numeric or string (ie. a position in the array of elements
    // or an object field
    var index = 0;

    // Track vertical dimension
    // width should be global because we don't allow different tracks to have different widths
    var height = 250; 

    // The foreground color of the track
    var fg_color = d3.rgb('#000000');

    // The background color of the track
    var bg_color = d3.rgb('#CCCCCC');

    // Layout only applies to genes because we don't want them to collide
    var layout; // For the genes track this has to be set to epeek.genome.layout()

    // We probably need a REST connection
    // TODO: Not all the tracks will need this. Is there a simple way of doing this optional?
    var eRest = epeek.eRest();

    // This is the function that is called on update
    var updater = function(){};

    // info_callback is a callback called every time an element is clicked
    var info_callback = function(){};

    var pin_url = "";

    var newtrack = function() {
    };

    newtrack.retriever = {};

    newtrack.retriever.local = function() {
	var retriever = function(){};
	var success   = function(){}
	var update_track = function(obj) {
	    // Object has loc and a plug-in defined callback
	    var loc = obj.loc;
	    var plugin_cbak = obj.on_success;
	    elements = retriever(loc);
	    plugin_cbak();
	};

	update_track.retriever = function (cbak) {
	    if (!arguments.length) {
		return retriever;
	    }
	    retriever = cbak;
	    return update_track;
	};

	update_track.success = function (cbak) {
	    if (!arguments.length) {
		return success;
	    }
	    success = cbak;
	    return update_track;
	};

	return update_track;
    };
    
    newtrack.retriever.ensembl = function() {
	var success = [function(){}];
	var fail = function(){};
	var endpoint;
	var update_track = function(obj) {
	    // Object has loc and a plug-in defined callback
	    var loc         = obj.loc;
	    var plugin_cbak = obj.on_success;
	    eRest.call({url     : eRest.url[endpoint](loc),
			success : function (resp) {
			    elements = resp;

			    // User-defined
			    for (var i=0; i<success.length; i++) {
				success[i](resp);
			    };

			    // Plug-in defined
			    plugin_cbak();
			}
		       });

	    // update_cback(obj.data);
	};

	update_track.endpoint = function (u) {
	    if (!arguments.length) {
		return endpoint;
	    }
	    endpoint = u;
	    return update_track;
	};

	update_track.update_callback = function (callback) {
	    if (!arguments.length) {
		return update_cback
	    }
	    update_cback = callback;
	    return update_track;
	};

	// TODO: We don't have a way of resetting the success array
	// TODO: Should this also be included in the local retriever?
	// Still not sure this is the best option to support more than one callback
	update_track.success = function (callback) {
	    if (!arguments.length) {
		return success;
	    }
	    success.push(callback);
	    return update_track;
	};

	// update_track.success = function (callback) {
	//     if (!arguments.length) {
	// 	return success;
	//     }
	//     success = callback;
	//     return update_track;
	// };

	update_track.fail = function (callback) {
	    if (!arguments.length) {
		return fail;
	    }
	    fail = callback;
	    return update_track;
	}
	return update_track;
    };


    // API
    newtrack.label = function (n) {
	if (!arguments.length) {
	    return label;
	}
	label = n;
	return newtrack;
    };

    newtrack.display = function (s) {
	if (!arguments.length) {
	    return display;
	}
	display = s;
	return newtrack;
    }

    newtrack.pin_url = function (url) {
	if (!arguments.length) {
	    return pin_url;
	}
	pin_url = url;
	return newtrack;
    };

    newtrack.index = function (i) {
	if (!arguments.length) {
	    return index;
	}
	index = i;
	return newtrack;
    };

    newtrack.elements = function (elms) {
	if (!arguments.length) {
	    return elements;
	}
	elements = elms;
	return newtrack;
    };

    newtrack.layout = function (callback) {
	if (!arguments.length) {
	    return layout;
	}
	layout = callback;
	layout.height(height);
	return newtrack;
    };

    newtrack.foreground_color = function (color) {
	if (!arguments.length) {
	    return fg_color;
	}
	fg_color = color;
	return newtrack;
    };

    newtrack.background_color = function (color) {
	if (!arguments.length) {
	    return bg_color;
	}
	bg_color = color;
	return newtrack;
    };

    newtrack.height = function (h) {
	if (!arguments.length) {
	    return height;
	}
	height = h;
	if (layout !== undefined) {
	    layout.height(height);
	}
	return newtrack;
    };

    newtrack.update = function (callback) {
	if (!arguments.length) {
	    return updater;
	}
	updater = callback;
	return newtrack;
    };

    newtrack.info_callback = function (callback) {
	if (!arguments.length) {
	    return info_callback;
	}
	info_callback = callback;
	return newtrack;
    };

    return newtrack;
};


// A predefined track for genes
epeek.genome.track.gene = function () {
    var track = epeek.genome.track()
	.display("feature")
	.index("ID")
	.layout(epeek.genome.layout());

    track.tooltip = function () {
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

    var updater = track.retriever.ensembl()
	.endpoint("region")
    // TODO: If success is defined here, means that it can't be user-defined
    // is that good? enough? API?
    // Now success is backed up by an array
	.success(function(genes) {
	    for (var i = 0; i < genes.length; i++) {
		if (genes[i].strand === -1) {  
		    genes[i].display_label = "<" + genes[i].external_name;
		} else {
		    genes[i].display_label = genes[i].external_name + ">";
		}
	    }
	});

    return track.update(updater);
}

// A predefined track for blocks
epeek.genome.track.block = function() {
    var track = epeek.genome.track()
	.display("block")
	.index("start");

    return track;
};

// A predefined track for pins
epeek.genome.track.pin = function() {
    // The path to the current ePeek.js script
    var path = epeek.utils.script_path("ePeek.js");
    var pin_color = "red";
    var pin_url = path + "lib/pins/pin_red.png";
    var pins_icons = [path + "lib/pins/pin_red.png",
		      path + "lib/pins/pin_blue.png",
		      path + "lib/pins/pin_green.png",                                                            
		      path + "lib/pins/pin_yellow.png",
		      path + "lib/pins/pin_magenta.png",
		      path + "lib/pins/pin_gray.png"];

    var track = epeek.genome.track()
	.display("pin")
	.index("pos");

    track.pin_color = function(c) {
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
	return track;
    };

    track.pin_url = function (url) {
	if (!arguments.length) {
	    return pin_url;
	}
	pin_url = url;
	return track;
    };

    return track;
};

    // var gene_track = epeek.genome.track()
    // 	// .name("Gene")
    // 	.height(200)
    // 	.foreground_color("red")
    // 	.index("ID")
    // 	.layout(epeek.genome.layout());

    // var gene_update = gene_track.update()
    // 	.success(function(genes){
    // 	    for (var i = 0; i < genes.length; i++) {
    // 		if (genes[i].strand === -1) {  
    // 		    genes[i].display_label = "<" + genes[i].external_name;
    // 		} else {
    // 		    genes[i].display_label = genes[i].external_name + ">";
    // 		}
    // 	    }
    // 	});

    // return {
    // 	'track'  : gene_track,
    // 	'update' : gene_update
    // };
// }

